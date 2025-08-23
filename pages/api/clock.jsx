// Store the server start time (this will persist across requests)
let serverStartTime = null;

export default function handler(req, res) {
    if (req.method === 'GET') {
        // Initialize server start time if not set
        if (!serverStartTime) {
            serverStartTime = 1755903600000;
        }

        // Return the server start time and current time
        res.status(200).json({
            serverStartTime,
            currentTime: Date.now()
        });
    } else {
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}