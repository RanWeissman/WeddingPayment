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
 * Checks and updates the per-IP rate limit counter in the existing DynamoDB table.
 * Fail-Open: if any unexpected DB error occurs, logs a warning and returns false (not blocked).
 * @returns {Promise<boolean>} true if rate limit is exceeded (should block with 429)
 */
async function isRateLimited(clientIp) {
    try {
        const nowSec = Math.floor(Date.now() / 1000);
        const keySlug = `${RATE_LIMIT_PREFIX}${clientIp}`;

        const res = await dynamo.send(new GetCommand({
            TableName: TABLE_NAME,
            Key: { slug: keySlug }
        }));

        const existing = res.Item;
        if (existing && typeof existing.ttl === 'number' && nowSec < existing.ttl) {
            if ((existing.count || 0) >= RATE_LIMIT_MAX) {
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
                ttl: nowSec + RATE_LIMIT_WINDOW_SECONDS
            }
        }));
        return false;
    } catch (err) {
        console.warn('Rate-limit check failed (Fail-Open triggered):', err);
        return false;
    }
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
            const body = JSON.parse(event.body || '{}');
            
            // Validate required fields
            if (!body.coupleNames) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'coupleNames is required' })
                };
            }

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
                coupleNames: body.coupleNames,
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

            // Fetch from DynamoDB
            const response = await dynamo.send(new GetCommand({
                TableName: TABLE_NAME,
                Key: { slug: slug }
            }));

            if (!response.Item) {
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

            headers['Cache-Control'] = 'public, max-age=31536000';

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

            // ── RATE LIMIT CHECK (before reading event or decrypting PII) ────────
            const clientIp = getClientIp(event);
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
            const response = await dynamo.send(new GetCommand({
                TableName: TABLE_NAME,
                Key: { slug: slug }
            }));

            if (!response.Item) {
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
