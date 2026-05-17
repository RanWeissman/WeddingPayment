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

            let slug;
            if (body.customSlug && body.customSlug.trim() !== '') {
                slug = sanitizeToKebabCase(body.customSlug);
            } else {
                slug = sanitizeToKebabCase(transliterate(body.coupleNames));
            }

            // Prepare item
            const item = {
                slug: slug,
                coupleNames: body.coupleNames,
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

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(response.Item)
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
