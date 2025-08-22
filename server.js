const express = require('express');
const cors = require('cors');
const { put, list, del } = require('@vercel/blob');
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Store name for Vercel Blob Storage
const STORE_NAME = 'moon-studio-animation-main-db-ht';

// Nominees data (same as frontend)
const nominees = [
  { id: 1, name: "Moon Studio Animation" },
  { id: 2, name: "Seel" },
  { id: 3, name: "Epic" },
  { id: 4, name: "Pool" },
  { id: 5, name: "Adorable Steve" },
  { id: 6, name: "Mar" },
  { id: 7, name: "JSkript" }
];

// Helper function to get current vote counts
async function getVoteCounts() {
  try {
    // Initialize vote counts
    const voteCounts = {};
    nominees.forEach(nominee => {
      voteCounts[nominee.id] = 0;
    });

    // List all blobs in the store
    const { blobs } = await list({
      prefix: 'votes/',
      store: STORE_NAME
    });

    // Count votes from each blob
    for (const blob of blobs) {
      if (blob.pathname.startsWith('votes/')) {
        // Extract nominee ID from filename (votes/nominee-X.json)
        const match = blob.pathname.match(/votes\/nominee-(\d+)\.json/);
        if (match) {
          const nomineeId = parseInt(match[1]);
          // Each file represents one vote, so increment count
          if (voteCounts.hasOwnProperty(nomineeId)) {
            voteCounts[nomineeId]++;
          }
        }
      }
    }

    return voteCounts;
  } catch (error) {
    console.error('Error getting vote counts:', error);
    throw new Error('Failed to retrieve vote counts');
  }
}

// API endpoint to get current results
app.get('/api/votes', async (req, res) => {
  try {
    const voteCounts = await getVoteCounts();
    res.json(voteCounts);
  } catch (error) {
    console.error('Error in /api/votes:', error);
    res.status(500).json({ error: 'Failed to retrieve votes' });
  }
});

// API endpoint to submit a vote
app.post('/api/votes', async (req, res) => {
  try {
    const { nomineeId, voterId } = req.body;

    // Validate input
    if (!nomineeId || !voterId) {
      return res.status(400).json({ error: 'Missing nomineeId or voterId' });
    }

    const nominee = nominees.find(n => n.id === parseInt(nomineeId));
    if (!nominee) {
      return res.status(400).json({ error: 'Invalid nominee ID' });
    }

    // Check if this voter has already voted
    try {
      const existingVote = await list({
        prefix: `voters/${voterId}/`,
        store: STORE_NAME
      });

      if (existingVote.blobs.length > 0) {
        return res.status(400).json({ error: 'You have already voted' });
      }
    } catch (error) {
      console.error('Error checking existing vote:', error);
      // Continue with vote submission if check fails
    }

    // Generate unique filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const voteFilename = `votes/nominee-${nomineeId}-${timestamp}.json`;
    const voterFilename = `voters/${voterId}/vote-${timestamp}.json`;

    // Store the vote
    const voteData = {
      nomineeId: parseInt(nomineeId),
      nomineeName: nominee.name,
      voterId: voterId,
      timestamp: new Date().toISOString()
    };

    await put(voteFilename, JSON.stringify(voteData), {
      access: 'public',
      contentType: 'application/json',
      store: STORE_NAME
    });

    // Record that this voter has voted
    await put(voterFilename, JSON.stringify({ voted: true }), {
      access: 'public',
      contentType: 'application/json',
      store: STORE_NAME
    });

    // Return updated vote counts
    const voteCounts = await getVoteCounts();
    res.json({ 
      success: true, 
      message: `Vote for ${nominee.name} recorded successfully`,
      votes: voteCounts 
    });
  } catch (error) {
    console.error('Error in POST /api/votes:', error);
    res.status(500).json({ error: 'Failed to submit vote' });
  }
});

// API endpoint to get nominee list
app.get('/api/nominees', (req, res) => {
  res.json(nominees);
});

// API endpoint to reset votes (admin function)
app.delete('/api/votes', async (req, res) => {
  try {
    // Warning: This will delete ALL votes
    const { blobs } = await list({
      prefix: 'votes/',
      store: STORE_NAME
    });

    // Delete all vote blobs
    for (const blob of blobs) {
      await del(blob.url, { store: STORE_NAME });
    }

    console.log("DEBUG: api votes have been triggered.");

    res.json({ success: true, message: 'All votes have been reset' });
  } catch (error) {
    console.error('Error resetting votes:', error);
    res.status(500).json({ error: 'Failed to reset votes' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(port, () => {
  console.log(`Voting API server running on port ${port}`);
});