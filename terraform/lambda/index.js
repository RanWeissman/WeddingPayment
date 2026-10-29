const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');
const crypto = require('crypto');

const client = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TABLE_NAME || 'Gift4Event-Configurations';

// ── Rate Limiting Constants (Section 6) ───────────────────────────────────────
const RATE_LIMIT_MAX = 30;               // 30 requests per IP per hour (Wi-Fi / CGNAT safe)
const RATE_LIMIT_WINDOW_SECONDS = 3600;  // 1 hour window
const RATE_LIMIT_PREFIX = 'ratelimit#';

// ── Event Creation Rate Limiting Constants (Security Section 3) ───────────────
const CREATE_RATE_LIMIT_MAX = 10;               // 10 event creations per IP per hour
const CREATE_RATE_LIMIT_WINDOW_SECONDS = 3600;  // 1 hour window
const CREATE_RATE_LIMIT_PREFIX = 'ratelimit_create#';

// ── Brute Force Protection Constants (Section 7) ──────────────────────────────
const BF_MAX_404_ERRORS = 15;            // 15 missing-slug (404) errors per IP within 60s
const BF_WINDOW_SECONDS = 60;            // 60-second detection window
const BF_QUARANTINE_SECONDS = 900;       // 15-minute (900s) quarantine duration
const BF_PREFIX = 'bruteforce#';
const blockedIpsCache = new Map();       // Tier-1 in-memory cache: ip -> blockedUntilEpoch

/**
 * Extracts client IP safely behind CloudFront + API Gateway.
 * CloudFront places the real viewer IP first in X-Forwarded-For.
 */
function getClientIp(event) {
    const xff = event.headers?.['x-forwarded-for'] || event.headers?.['X-Forwarded-For'];
    if (xff) {
        const firstIp = xff.split(',')[0].trim();
        if (firstIp) return firstIp;
    }
    return event.requestContext?.identity?.sourceIp || 'unknown';
}

/**
 * Tier-1 Fast Path (0ms, 0 DynamoDB reads):
 * Checks if the client IP is currently quarantined in the Lambda instance memory.
 */
function isIpQuarantinedInMemory(clientIp) {
    const blockedUntil = blockedIpsCache.get(clientIp);
    if (!blockedUntil) return false;
    const nowSec = Math.floor(Date.now() / 1000);
    if (nowSec < blockedUntil) {
        return true;
    }
    blockedIpsCache.delete(clientIp);
    return false;
}

/**
 * Tier-3 On-404 Handler (only called when a requested event slug does NOT exist):
 * Records a 404 miss for clientIp in DynamoDB and returns true if the IP is now quarantined.
 * Fail-Open: returns false on any unexpected DB error.
 */
async function record404AndCheckQuarantine(clientIp) {
    try {
        const nowSec = Math.floor(Date.now() / 1000);
        const keySlug = `${BF_PREFIX}${clientIp}`;

        const res = await dynamo.send(new GetCommand({
            TableName: TABLE_NAME,
            Key: { slug: keySlug }
        }));

        const existing = res.Item;

        // If already quarantined in DB, sync to in-memory cache and block
        if (existing && typeof existing.blockedUntil === 'number' && nowSec < existing.blockedUntil) {
            blockedIpsCache.set(clientIp, existing.blockedUntil);
            return true;
        }

        // If within active 60s counting window, increment count
        if (existing && typeof existing.windowEnd === 'number' && nowSec < existing.windowEnd) {
            const newCount = (existing.count || 0) + 1;
            if (newCount >= BF_MAX_404_ERRORS) {
                const blockedUntil = nowSec + BF_QUARANTINE_SECONDS;
                await dynamo.send(new PutCommand({
                    TableName: TABLE_NAME,
                    Item: {
                        slug: keySlug,
                        count: newCount,
                        windowEnd: existing.windowEnd,
                        blockedUntil: blockedUntil,
                        ttl: blockedUntil
                    }
                }));
                blockedIpsCache.set(clientIp, blockedUntil);
                console.warn(`Quarantined IP ${clientIp} for ${BF_QUARANTINE_SECONDS}s after ${newCount} 404 errors.`);
                return true;
            }

            await dynamo.send(new PutCommand({
                TableName: TABLE_NAME,
                Item: {
                    slug: keySlug,
                    count: newCount,
                    windowEnd: existing.windowEnd,
                    ttl: existing.windowEnd
                }
            }));
            return false;
        }

        // Start a fresh 60s counting window
        const windowEnd = nowSec + BF_WINDOW_SECONDS;
        await dynamo.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: {
                slug: keySlug,
                count: 1,
                windowEnd: windowEnd,
                ttl: windowEnd
            }
        }));
        return false;
    } catch (err) {
        console.warn('Brute-force 404 tracking failed (Fail-Open triggered):', err);
        return false;
    }
}

/**
 * Checks and updates the per-IP rate limit counter in the existing DynamoDB table.
 * Fail-Open: if any unexpected DB error occurs, logs a warning and returns false (not blocked).
 * @returns {Promise<boolean>} true if rate limit is exceeded (should block with 429)
 */
async function isRateLimited(clientIp, prefix = RATE_LIMIT_PREFIX, maxRequests = RATE_LIMIT_MAX, windowSeconds = RATE_LIMIT_WINDOW_SECONDS) {
    try {
        const nowSec = Math.floor(Date.now() / 1000);
        const keySlug = `${prefix}${clientIp}`;

        const res = await dynamo.send(new GetCommand({
            TableName: TABLE_NAME,
            Key: { slug: keySlug }
        }));

        const existing = res.Item;
        if (existing && typeof existing.ttl === 'number' && nowSec < existing.ttl) {
            if ((existing.count || 0) >= maxRequests) {
                console.warn(`Rate limit exceeded for IP ${clientIp} on prefix ${prefix}`);
                return true; // Quota exceeded within active window
            }
            await dynamo.send(new PutCommand({
                TableName: TABLE_NAME,
                Item: {
                    slug: keySlug,
                    count: (existing.count || 0) + 1,
                    ttl: existing.ttl
                }
            }));
            return false;
        }

        // Start a fresh 1-hour window
        await dynamo.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: {
                slug: keySlug,
                count: 1,
                ttl: nowSec + windowSeconds
            }
        }));
        return false;
    } catch (err) {
        console.warn('Rate-limit check failed (Fail-Open triggered):', err);
        return false;
    }
}

async function isCreateRateLimited(clientIp) {
    return isRateLimited(clientIp, CREATE_RATE_LIMIT_PREFIX, CREATE_RATE_LIMIT_MAX, CREATE_RATE_LIMIT_WINDOW_SECONDS);
}

function isInternalKey(slug) {
    return (
        !slug ||
        slug.startsWith(RATE_LIMIT_PREFIX) ||
        slug.startsWith(CREATE_RATE_LIMIT_PREFIX) ||
        slug.startsWith(BF_PREFIX)
    );
}
// ─────────────────────────────────────────────────────────────────────────────

// ── AES-256-GCM Field Encryption ─────────────────────────────────────────────
// Storage format: "v1:<ivHex>:<tagHex>:<ciphertextHex>"
const CIPHER_ALGORITHM = 'aes-256-gcm';
const KEY_VERSION = 'v1';

function getEncryptionKey() {
    const keyHex = process.env.ENCRYPTION_KEY || '';
    if (keyHex.length !== 64) {
        throw new Error('ENCRYPTION_KEY must be a 64-character hex string (32 bytes).');
    }
    return Buffer.from(keyHex, 'hex');
}

function encryptField(plaintext) {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(12); // 96-bit IV — unique per encryption
    const cipher = crypto.createCipheriv(CIPHER_ALGORITHM, key, iv);
    const encrypted = Buffer.concat([
        cipher.update(String(plaintext), 'utf8'),
        cipher.final()
    ]);
    const tag = cipher.getAuthTag(); // 16-byte GCM auth tag
    return `${KEY_VERSION}:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

function decryptField(stored) {
    const parts = stored.split(':');
    if (parts.length !== 4 || parts[0] !== KEY_VERSION) {
        throw new Error('Invalid ciphertext format — expected v1:iv:tag:cipher');
    }
    const [, ivHex, tagHex, dataHex] = parts;
    const key = getEncryptionKey();
    const decipher = crypto.createDecipheriv(
        CIPHER_ALGORITHM,
        key,
        Buffer.from(ivHex, 'hex')
    );
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    return decipher.update(Buffer.from(dataHex, 'hex'), undefined, 'utf8') + decipher.final('utf8');
}

/** Returns true if a stored value is already ciphertext (not plain-text). */
function isEncrypted(value) {
    return typeof value === 'string' && value.startsWith(`${KEY_VERSION}:`);
}
// ─────────────────────────────────────────────────────────────────────────────

// Basic Hebrew to English transliteration map
const hebrewToEnglish = {
    'א': 'a', 'ב': 'b', 'ג': 'g', 'ד': 'd', 'ה': 'h',
    'ו': 'v', 'ז': 'z', 'ח': 'ch', 'ט': 't', 'י': 'y',
    'כ': 'k', 'ך': 'k', 'ל': 'l', 'מ': 'm', 'ם': 'm',
    'נ': 'n', 'ן': 'n', 'ס': 's', 'ע': 'a', 'פ': 'p',
    'ף': 'p', 'צ': 'ts', 'ץ': 'ts', 'ק': 'k', 'ר': 'r',
    'ש': 'sh', 'ת': 't', ' ': '-'
};

function transliterate(text) {
    if (!text) return 'event';
    let result = '';
    for (const char of text) {
        if (hebrewToEnglish[char]) {
            result += hebrewToEnglish[char];
        } else if (/[a-zA-Z0-9-]/.test(char)) {
            result += char.toLowerCase();
        }
    }
    result = result.replace(/-+/g, '-').replace(/^-|-$/g, '');
    return result || 'event';
}

/**
 * Returns true if the event date + 7 days is in the past (UTC).
 * @param {string} eventDateStr - ISO date string 'YYYY-MM-DD'
 */
function isEventExpired(eventDateStr) {
    if (!eventDateStr) return false;
    const eventDate = new Date(eventDateStr + 'T00:00:00Z');
    if (isNaN(eventDate.getTime())) return false;
    const expiry = new Date(eventDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    return Date.now() > expiry.getTime();
}

exports.handler = async (event) => {
    console.log('Event:', JSON.stringify(event));

    const method = event.httpMethod;
    const path = event.resource || event.path;

    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
    };

    if (method === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        if (method === 'POST' && path.includes('/api/create')) {
            const clientIp = getClientIp(event);

            // ── Tier-1 Fast Path: Check in-memory quarantine (0 DB reads) ─────
            if (isIpQuarantinedInMemory(clientIp)) {
                return {
                    statusCode: 403,
                    headers,
                    body: JSON.stringify({
                        error: 'הגישה נחסמה זמנית עקב ניסיונות סריקה מרובים. אנא נסו שוב מאוחר יותר.'
                    })
                };
            }

            const body = JSON.parse(event.body || '{}');
            
            // ── Validate Event Type, SubType & Custom Event Name ──────────────
            const allowedEventTypes = new Set(['wedding', 'brit_brita', 'bar_bat_mitzvah', 'birthday', 'henna', 'other']);
            const rawEventType = String(body.eventType || 'wedding').trim().toLowerCase();
            const eventType = rawEventType || 'wedding';

            if (!allowedEventTypes.has(eventType)) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'סוג האירוע שנבחר אינו תקין.' })
                };
            }

            const rawSubType = String(body.eventSubType || '').trim().toLowerCase();
            let eventSubType = '';
            if (eventType === 'brit_brita') {
                if (rawSubType !== 'brit_milah' && rawSubType !== 'brita') {
                    return {
                        statusCode: 400,
                        headers,
                        body: JSON.stringify({ error: 'יש לבחור תת-סוג אירוע (ברית מילה או בריתה).' })
                    };
                }
                eventSubType = rawSubType;
            } else if (eventType === 'bar_bat_mitzvah') {
                if (rawSubType !== 'bar_mitzvah' && rawSubType !== 'bat_mitzvah') {
                    return {
                        statusCode: 400,
                        headers,
                        body: JSON.stringify({ error: 'יש לבחור תת-סוג אירוע (בר מצווה או בת מצווה).' })
                    };
                }
                eventSubType = rawSubType;
            }

            const rawCustomEventName = String(body.customEventName || '').trim();
            let customEventName = '';
            if (eventType === 'other') {
                if (!rawCustomEventName) {
                    return {
                        statusCode: 400,
                        headers,
                        body: JSON.stringify({ error: 'שם האירוע הוא שדה חובה כאשר בוחרים "אחר".' })
                    };
                }
                if (rawCustomEventName.length > 15) {
                    return {
                        statusCode: 400,
                        headers,
                        body: JSON.stringify({ error: 'שם האירוע מוגבל ל-15 תווים לכל היותר.' })
                    };
                }
                customEventName = rawCustomEventName;
            }

            const coupleNames = String(body.coupleNames || '').trim();
            // Validate required fields
            if (!coupleNames) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'שם בעלי האירוע הוא שדה חובה.' })
                };
            }
            // ───────────────────────────────────────────────────────────────────

            // Validate eventDate — required and must not be in the past
            const eventDateStr = (body.eventDate || '').trim();
            if (!eventDateStr) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'תאריך האירוע הוא שדה חובה.' })
                };
            }
            const eventDateObj = new Date(eventDateStr + 'T00:00:00Z');
            if (isNaN(eventDateObj.getTime())) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'פורמט תאריך האירוע שגוי.' })
                };
            }
            const todayUTC = new Date();
            todayUTC.setUTCHours(0, 0, 0, 0);
            if (eventDateObj < todayUTC) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'לא ניתן ליצור דף תשלום עבור אירוע שכבר עבר. אנא בחרו תאריך עתידי.' })
                };
            }

            // ── CREATE RATE LIMIT CHECK (after validation so typos don't burn quota) ──
            if (await isCreateRateLimited(clientIp)) {
                headers['Retry-After'] = String(CREATE_RATE_LIMIT_WINDOW_SECONDS);
                return {
                    statusCode: 429,
                    headers,
                    body: JSON.stringify({
                        error: 'נרשמו יותר מדי ניסיונות יצירת דפים מכתובת זו. אנא נסו שוב מאוחר יותר.'
                    })
                };
            }
            // ──────────────────────────────────────────────────────────────────────────

            // Generate Slug
            function sanitizeToKebabCase(text) {
                if (!text) return 'event';
                let result = text.toLowerCase();
                result = result.replace(/[^a-z0-9]+/g, '-');
                result = result.replace(/-+/g, '-');
                result = result.replace(/^-|-$/g, '');
                return result || 'event';
            }

            let baseSlug;
            if (body.customSlug && body.customSlug.trim() !== '') {
                baseSlug = sanitizeToKebabCase(body.customSlug);
            } else {
                baseSlug = sanitizeToKebabCase(transliterate(body.coupleNames));
            }

            // Generate 4-character uppercase random suffix to prevent collisions
            const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
            const slug = `${baseSlug}-${suffix}`;

            // ── Encrypt sensitive bankDetails fields before DB storage ──────────
            const bankDetails = { ...(body.bankDetails || {}) };
            if (bankDetails.accountNumber) {
                bankDetails.accountNumber = encryptField(String(bankDetails.accountNumber));
            }
            // ───────────────────────────────────────────────────────────────────

            // Prepare item
            const item = {
                slug: slug,
                eventType: eventType,
                eventSubType: eventSubType,
                customEventName: customEventName,
                coupleNames: coupleNames,
                eventDate: eventDateStr,
                wazeLink: body.wazeLink || '',
                bankDetails: bankDetails,
                bitLinks: body.bitLinks || [],
                payboxLinks: body.payboxLinks || [],
                createdAt: new Date().toISOString()
            };

            // Save to DynamoDB
            try {
                await dynamo.send(new PutCommand({
                    TableName: TABLE_NAME,
                    Item: item,
                    ConditionExpression: 'attribute_not_exists(slug)'
                }));
            } catch (err) {
                if (err.name === 'ConditionalCheckFailedException') {
                    return {
                        statusCode: 409,
                        headers,
                        body: JSON.stringify({ error: 'שם הקישור שבחרתם כבר תפוס. אנא בחרו שם אחר.' })
                    };
                }
                throw err;
            }

            return {
                statusCode: 201,
                headers,
                body: JSON.stringify({ slug: slug, url: `https://gift4event.com/${slug}` })
            };
        } 
        
        if (method === 'GET' && path.includes('/api/config')) {
            const slug = event.pathParameters?.slug;
            
            if (!slug) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'slug is required' })
                };
            }

            const clientIp = getClientIp(event);

            // ── Tier-1 Fast Path: Check in-memory quarantine (0 DB reads) ─────
            if (isIpQuarantinedInMemory(clientIp)) {
                return {
                    statusCode: 403,
                    headers,
                    body: JSON.stringify({
                        error: 'הגישה נחסמה זמנית עקב ניסיונות סריקה מרובים. אנא נסו שוב מאוחר יותר.'
                    })
                };
            }

            // Fetch from DynamoDB (only if slug is not an internal key)
            let response = { Item: null };
            if (!isInternalKey(slug)) {
                response = await dynamo.send(new GetCommand({
                    TableName: TABLE_NAME,
                    Key: { slug: slug }
                }));
            }

            if (!response.Item) {
                // ── Tier-3 On-404 Only: Record 404 & check quarantine in DB ───
                if (await record404AndCheckQuarantine(clientIp)) {
                    return {
                        statusCode: 403,
                        headers,
                        body: JSON.stringify({
                            error: 'הגישה נחסמה זמנית עקב ניסיונות סריקה מרובים. אנא נסו שוב מאוחר יותר.'
                        })
                    };
                }
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({ error: 'Configuration not found' })
                };
            }

            const item = response.Item;

            // ── TIME WINDOW CHECK ────────────────────────────────────────────────
            if (isEventExpired(item.eventDate)) {
                const expiredPayload = {
                    slug: item.slug,
                    eventType: item.eventType || 'wedding',
                    eventSubType: item.eventSubType || '',
                    customEventName: item.customEventName || '',
                    coupleNames: item.coupleNames || '',
                    eventDate: item.eventDate || '',
                    isExpired: true,
                    bankDetails: null,
                    bitLinks: [],
                    payboxLinks: [],
                    wazeLink: '',
                    analyticsUrl: process.env.ANALYTICS_URL || null
                };
                headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, private';
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify(expiredPayload)
                };
            }
            // ────────────────────────────────────────────────────────────────────

            const returnData = {
                ...item,
                eventType: item.eventType || 'wedding',
                eventSubType: item.eventSubType || '',
                customEventName: item.customEventName || '',
                isExpired: false,
                analyticsUrl: process.env.ANALYTICS_URL || null
            };

            // ── Decrypt → then mask accountNumber for the public config response ─
            if (returnData.bankDetails && returnData.bankDetails.accountNumber) {
                let rawAcc = String(returnData.bankDetails.accountNumber);
                if (isEncrypted(rawAcc)) {
                    rawAcc = decryptField(rawAcc);
                }
                const maskedAcc = rawAcc.length > 3 ? '••••' + rawAcc.slice(-3) : '••••';
                returnData.bankDetails = {
                    ...returnData.bankDetails,
                    accountNumber: maskedAcc,
                    isMasked: true
                };
            }
            // ────────────────────────────────────────────────────────────────────

            headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, private';

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(returnData)
            };
        }

        if (method === 'GET' && path.includes('/api/payment-details')) {
            const slug = event.pathParameters?.slug;
            
            if (!slug) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'slug is required' })
                };
            }

            headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, private';
            const clientIp = getClientIp(event);

            // ── Tier-1 Fast Path: Check in-memory quarantine (0 DB reads) ─────
            if (isIpQuarantinedInMemory(clientIp)) {
                return {
                    statusCode: 403,
                    headers,
                    body: JSON.stringify({
                        error: 'הגישה נחסמה זמנית עקב ניסיונות סריקה מרובים. אנא נסו שוב מאוחר יותר.'
                    })
                };
            }

            // ── RATE LIMIT CHECK (before reading event or decrypting PII) ────────
            if (await isRateLimited(clientIp)) {
                headers['Retry-After'] = String(RATE_LIMIT_WINDOW_SECONDS);
                return {
                    statusCode: 429,
                    headers,
                    body: JSON.stringify({
                        error: 'נרשמו יותר מדי ניסיונות צפייה מכתובת זו. אנא נסו שוב מאוחר יותר.'
                    })
                };
            }
            // ────────────────────────────────────────────────────────────────────

            // Fetch from DynamoDB
            let response = { Item: null };
            if (!isInternalKey(slug)) {
                response = await dynamo.send(new GetCommand({
                    TableName: TABLE_NAME,
                    Key: { slug: slug }
                }));
            }

            if (!response.Item) {
                if (await record404AndCheckQuarantine(clientIp)) {
                    return {
                        statusCode: 403,
                        headers,
                        body: JSON.stringify({
                            error: 'הגישה נחסמה זמנית עקב ניסיונות סריקה מרובים. אנא נסו שוב מאוחר יותר.'
                        })
                    };
                }
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({ error: 'Configuration not found' })
                };
            }

            // ── TIME WINDOW ENFORCEMENT (server-side, UTC clock) ─────────────────
            if (isEventExpired(response.Item.eventDate)) {
                return {
                    statusCode: 403,
                    headers,
                    body: JSON.stringify({ error: 'חלון הזמן לגישה לפרטי התשלום הסתיים.' })
                };
            }
            // ────────────────────────────────────────────────────────────────────

            // ── Decrypt accountNumber before returning to client ──────────────────
            let rawAccount = String(response.Item.bankDetails?.accountNumber || '');
            if (isEncrypted(rawAccount)) {
                rawAccount = decryptField(rawAccount);
            }
            // ────────────────────────────────────────────────────────────────────

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ accountNumber: rawAccount })
            };
        }

        return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'Not Found' })
        };

    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Internal Server Error' })
        };
    }
};
