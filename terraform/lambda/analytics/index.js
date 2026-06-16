const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const s3Client = new S3Client();
const BUCKET_NAME = process.env.BUCKET_NAME;

const ALLOWED_ACTIONS = new Set([
    'bank_copy',
    'bit_click',
    'paybox_click',
    'bit_bank_click',
    'paybox_bank_click',
    'waze_click'
]);

exports.handler = async (event) => {
    try {
        const body = JSON.parse(event.body || '{}');
        const { event_id, action_type } = body;

        // Validation
        if (!event_id) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'event_id is required' })
            };
        }

        if (!action_type || !ALLOWED_ACTIONS.has(action_type)) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Invalid action_type' })
            };
        }

        // Generate Server-side timestamp
        const now = new Date();
        const timestamp = now.toISOString();
        const year = now.getUTCFullYear();
        const month = String(now.getUTCMonth() + 1).padStart(2, '0');
        const day = String(now.getUTCDate()).padStart(2, '0');
        const unixTime = now.getTime();

        const payload = {
            event_id,
            timestamp,
            action_type
        };

        const fileName = `year=${year}/month=${month}/day=${day}/${event_id}_${unixTime}.json`;

        try {
            await s3Client.send(new PutObjectCommand({
                Bucket: BUCKET_NAME,
                Key: fileName,
                Body: JSON.stringify(payload),
                ContentType: 'application/json'
            }));
        } catch (s3Error) {
            // Fallback to CloudWatch on S3 failure
            console.error('S3 Write Failed. Payload:', JSON.stringify(payload), 'Error:', s3Error);
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Internal Server Error' })
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ status: 'ok' })
        };

    } catch (error) {
        console.error('Unexpected Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error' })
        };
    }
};
