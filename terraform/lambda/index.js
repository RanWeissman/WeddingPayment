const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TABLE_NAME || 'Gift4Event-Configurations';

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
                // Replace non-alphanumeric chars (including spaces, underscores) with a single hyphen
                result = result.replace(/[^a-z0-9]+/g, '-');
                // Remove consecutive hyphens
                result = result.replace(/-+/g, '-');
                // Trim hyphens from beginning and end
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

            // Prepare item
            const item = {
                slug: slug,
                coupleNames: body.coupleNames,
                eventDate: eventDateStr,
                wazeLink: body.wazeLink || '',
                bankDetails: body.bankDetails || {},
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

            // Set Cache-Control header for CloudFront to cache aggressively
            headers['Cache-Control'] = 'public, max-age=31536000'; // Cache for 1 year

            const item = response.Item;

            // ── TIME WINDOW CHECK ───────────────────────────────────────────────
            if (isEventExpired(item.eventDate)) {
                // Strip all payment data; only expose couple names and expiry flag
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
                // Expired responses must not be cached
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

            // Mask bank account number on initial configuration fetch
            if (returnData.bankDetails && returnData.bankDetails.accountNumber) {
                const rawAcc = String(returnData.bankDetails.accountNumber);
                const maskedAcc = rawAcc.length > 3 ? '••••' + rawAcc.slice(-3) : '••••';
                returnData.bankDetails = {
                    ...returnData.bankDetails,
                    accountNumber: maskedAcc,
                    isMasked: true
                };
            }

            // Cache active (non-expired) configs aggressively
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

            // Do not cache sensitive payment details
            headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, private';

            // ── TIME WINDOW ENFORCEMENT (server-side, UTC clock) ─────────────────
            if (isEventExpired(response.Item.eventDate)) {
                return {
                    statusCode: 403,
                    headers,
                    body: JSON.stringify({ error: 'חלון הזמן לגישה לפרטי התשלום הסתיים.' })
                };
            }
            // ────────────────────────────────────────────────────────────────────

            const rawAccount = response.Item.bankDetails?.accountNumber || '';
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ accountNumber: String(rawAccount) })
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
