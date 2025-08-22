import { put, get } from '@vercel/blob';

const BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

export default async function handler(req, res) {
    if (req.method === 'GET') {
        try {
            // Try to get existing timer from blob storage
            try {
                const blob = await get('timer-config.json', {
                    token: BLOB_READ_WRITE_TOKEN
                });
                const data = JSON.parse(blob.content);
                res.status(200).json(data);
            } catch (error) {
                // Create new timer if none exists
                const startTime = new Date();
                startTime.setDate(startTime.getDate() + 6);

                const timerData = {
                    startTime: startTime.toISOString(),
                    createdAt: new Date().toISOString()
                };

                await put('timer-config.json', JSON.stringify(timerData), {
                    access: 'public',
                    token: BLOB_READ_WRITE_TOKEN
                });

                res.status(200).json(timerData);
            }
        } catch (error) {
            console.error('Error with timer blob storage:', error);
            res.status(500).json({ error: 'Failed to get timer' });
        }
    }
}