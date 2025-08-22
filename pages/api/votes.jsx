// In-memory storage for demonstration
let votes = {
  1: 0, // Moon Studio Animation
  2: 0, // Seel
  3: 0, // Epic
  4: 0, // Pool
  5: 0, // Adorable Steve
  6: 0, // Mar
  7: 0  // JSkript
};

// Track voters to prevent duplicate votes
const voters = new Set();

export default function handler(req, res) {
  if (req.method === 'GET') {
    // Return current vote counts
    res.status(200).json(votes);
  } 
  else if (req.method === 'POST') {
    const { nomineeId, voterId } = req.body;

    // Validate request
    if (!nomineeId || !voterId) {
      return res.status(400).json({ error: 'Missing nomineeId or voterId' });
    }

    // Check if voter has already voted
    if (voters.has(voterId)) {
      return res.status(400).json({ error: 'You have already voted' });
    }

    // Check if nominee exists
    if (!votes.hasOwnProperty(nomineeId)) {
      return res.status(400).json({ error: 'Invalid nominee ID' });
    }

    // Record the vote
    votes[nomineeId] += 1;
    voters.add(voterId);

    // Return updated vote counts
    res.status(200).json(votes);
  } 
  else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}