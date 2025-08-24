import { put, list, del } from '@vercel/blob';

// Initialize with your Blob store details
const BLOB_STORE_URL = 'https://6afxgekkdgq7ifsy.public.blob.vercel-storage.com';
const BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

export default async function handler(req, res) {
    if (req.method === 'GET') {
        try {
            // Get all vote blobs
            const { blobs } = await list({
                prefix: 'votes/',
                token: BLOB_READ_WRITE_TOKEN
            });

            // Count votes for each nominee
            const voteCounts = {
                1: 0, // Moon Studio Animation
                2: 0, // Seel
                3: 0, // Epic
                4: 0, // Pool
                5: 0, // Adorable Steve
                6: 0, // Mar
                7: 0, // JSkript
                8: 0, // Rash
                9: 0  // Firey
            };

            for (const blob of blobs) {
                if (blob.pathname.startsWith('votes/nominee-')) {
                    // Extract nominee ID from filename: votes/nominee-X-timestamp.json
                    const nomineeIdMatch = blob.pathname.match(/votes\/nominee-(\d+)-/);
                    if (nomineeIdMatch) {
                        const nomineeId = parseInt(nomineeIdMatch[1]);
                        if (voteCounts.hasOwnProperty(nomineeId)) {
                            voteCounts[nomineeId]++;
                        }
                    }
                }
            }

            res.status(200).json(voteCounts);
        } catch (error) {
            console.error('Error fetching votes from blob storage:', error);
            res.status(500).json({ error: 'Failed to retrieve votes' });
        }
    }
    else if (req.method === 'POST') {
        try {
            const { nomineeId, voterId } = req.body;

            // Validate request
            if (!nomineeId || !voterId) {
                return res.status(400).json({ error: 'Missing nomineeId or voterId' });
            }

            // Check if voter has already voted
            const voterBlobs = await list({
                prefix: `voters/${voterId}/`,
                token: BLOB_READ_WRITE_TOKEN
            });

            if (voterBlobs.blobs.length > 0) {
                return res.status(400).json({ error: 'You have already voted' });
            }

            // Create vote record
            const timestamp = new Date().toISOString();
            const voteFilename = `votes/nominee-${nomineeId}-${timestamp}.json`;
            const voterFilename = `voters/${voterId}/vote-${timestamp}.json`;

            // Store the vote
            const voteData = {
                nomineeId: parseInt(nomineeId),
                voterId: voterId,
                timestamp: timestamp
            };

            await put(voteFilename, JSON.stringify(voteData), {
                access: 'public',
                token: BLOB_READ_WRITE_TOKEN
            });

            // Record that this voter has voted
            await put(voterFilename, JSON.stringify({ voted: true }), {
                access: 'public',
                token: BLOB_READ_WRITE_TOKEN
            });

            // Return updated vote counts
            const { blobs } = await list({
                prefix: 'votes/',
                token: BLOB_READ_WRITE_TOKEN
            });

            const voteCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };

            for (const blob of blobs) {
                if (blob.pathname.startsWith('votes/nominee-')) {
                    const nomineeIdMatch = blob.pathname.match(/votes\/nominee-(\d+)-/);
                    if (nomineeIdMatch) {
                        const nomineeId = parseInt(nomineeIdMatch[1]);
                        if (voteCounts.hasOwnProperty(nomineeId)) {
                            voteCounts[nomineeId]++;
                        }
                    }
                }
            }

            res.status(200).json(voteCounts);
        } catch (error) {
            console.error('Error saving vote to blob storage:', error);
            res.status(500).json({ error: 'Failed to submit vote' });
        }
    }
    else {
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}