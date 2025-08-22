// pages/api/check-maintenance.js
import { get } from '@vercel/blob';

const BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

export default async function handler(req, res) {
    if (req.method === 'GET') {
        try {
            // Check if maintenance file exists in blob storage
            try {
                const blob = await get('isMaintenance.json', {
                    token: BLOB_READ_WRITE_TOKEN
                });
                const maintenanceData = JSON.parse(blob.content);
                res.status(200).json({ maintenance: maintenanceData.enabled || false });
            } catch (error) {
                // If file doesn't exist, maintenance is off
                res.status(200).json({ maintenance: false });
            }
        } catch (error) {
            console.error('Error checking maintenance mode:', error);
            res.status(200).json({ maintenance: false });
        }
    } else {
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}