// This is a backend API endpoint
let votes = {
    "Moon Studio Animation": 0,
    "Seel": 0,
    "Epic": 0,
    "Rash": 0,
    "Adorable Steve": 0,
    "Mar": 0,
    "JSkript": 0,
    "Firey": 0
  };
  
  export default function handler(req, res) {
    if (req.method === 'POST') {
      // Handle vote submission
      const { nominee } = req.body;
      
      if (nominee && votes.hasOwnProperty(nominee)) {
        votes[nominee] += 1;
        res.status(200).json({ success: true, votes });
      } else {
        res.status(400).json({ error: 'Invalid nominee' });
      }
    } else if (req.method === 'GET') {
      // Return current vote counts
      res.status(200).json(votes);
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  }