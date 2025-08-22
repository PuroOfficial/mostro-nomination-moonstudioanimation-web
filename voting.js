// Nominees data
const nominees = [
  { id: 1, name: "Moon Studio Animation" },
  { id: 2, name: "Seel" },
  { id: 3, name: "Epic" },
  { id: 4, name: "Pool" },
  { id: 5, name: "Adorable Steve" },
  { id: 6, name: "Mar" },
  { id: 7, name: "JSkript" }
];

// Vercel Blob Storage configuration
const BLOB_STORE_URL = 'https://hptxxiyweftwqbxs.public.blob.vercel-storage.com';
const STORE_NAME = 'moon-studio-animation-main-db-ht';

// Set countdown to 6 days from now
const countdownDate = new Date();
countdownDate.setDate(countdownDate.getDate() + 6);

// Store user's vote
let selectedNominee = null;

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
  renderNominees();
  updateResults();
  startCountdown();
  
  // Add event listeners
  document.getElementById('vote-btn').addEventListener('click', submitVote);
  document.getElementById('refresh-btn').addEventListener('click', updateResults);
  document.getElementById('reset-btn').addEventListener('click', resetVote);
});

// Render nominee cards
function renderNominees() {
  const container = document.getElementById('nominees-container');
  container.innerHTML = '';
  
  nominees.forEach(nominee => {
      const card = document.createElement('div');
      card.className = 'nominee-card';
      card.innerHTML = `
          <h3>${nominee.name}</h3>
          <p>Click to select</p>
      `;
      
      card.addEventListener('click', () => {
          if (hasVoted()) {
              showNotification("You've already voted!", true);
              return;
          }
          
          // Deselect all cards
          document.querySelectorAll('.nominee-card').forEach(c => {
              c.classList.remove('selected');
          });
          
          // Select this card
          card.classList.add('selected');
          selectedNominee = nominee.id;
          
          // Enable vote button
          document.getElementById('vote-btn').disabled = false;
      });
      
      container.appendChild(card);
  });
}

// Update results display
async function updateResults() {
  const resultsContainer = document.getElementById('results-container');
  resultsContainer.innerHTML = '<p>Loading results...</p>';
  
  try {
      // Get votes from blob storage
      const votes = await getVotesFromBlobStorage();
      
      // Calculate total votes
      const totalVotes = Object.values(votes).reduce((sum, count) => sum + count, 0);
      
      resultsContainer.innerHTML = '';
      
      nominees.forEach(nominee => {
          const voteCount = votes[nominee.id] || 0;
          const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
          
          const resultBar = document.createElement('div');
          resultBar.className = 'result-bar';
          resultBar.style.width = `${Math.max(10, percentage)}%`;
          resultBar.innerHTML = `
              ${nominee.name}
              <span class="vote-count">${voteCount} votes (${percentage}%)</span>
          `;
          
          resultsContainer.appendChild(resultBar);
      });
  } catch (error) {
      resultsContainer.innerHTML = '<p>Error loading results. Please try again.</p>';
      console.error('Error loading results:', error);
  }
}

// Start the countdown timer
function startCountdown() {
  function updateCountdown() {
      const now = new Date().getTime();
      const distance = countdownDate - now;
      
      if (distance < 0) {
          clearInterval(countdownInterval);
          document.getElementById('countdown').textContent = "Voting has ended!";
          document.getElementById('vote-btn').disabled = true;
          return;
      }
      
      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);
      
      document.getElementById('countdown').textContent = 
          `${days}d ${hours}h ${minutes}m ${seconds}s`;
  }
  
  // Update immediately and then every second
  updateCountdown();
  const countdownInterval = setInterval(updateCountdown, 1000);
}

// Check if user has already voted
function hasVoted() {
  return localStorage.getItem('hasVoted') === 'true';
}

// Submit vote
async function submitVote() {
  if (hasVoted()) {
      showNotification("You've already voted!", true);
      return;
  }
  
  if (!selectedNominee) {
      showNotification("Please select a nominee first!", true);
      return;
  }
  
  try {
      // Save vote to blob storage
      await saveVoteToBlobStorage(selectedNominee);
      
      // Mark user as voted
      localStorage.setItem('hasVoted', 'true');
      localStorage.setItem('votedFor', selectedNominee);
      
      // Show success message
      showNotification(`Your vote for ${getNomineeName(selectedNominee)} has been recorded!`);
      
      // Disable vote button
      document.getElementById('vote-btn').disabled = true;
      
      // Update results display
      await updateResults();
  } catch (error) {
      showNotification("Error submitting vote. Please try again.", true);
      console.error('Error submitting vote:', error);
  }
}

// Reset user's vote (for testing)
function resetVote() {
  localStorage.removeItem('hasVoted');
  localStorage.removeItem('votedFor');
  selectedNominee = null;
  
  // Deselect all cards
  document.querySelectorAll('.nominee-card').forEach(c => {
      c.classList.remove('selected');
  });
  
  // Disable vote button
  document.getElementById('vote-btn').disabled = true;
  
  showNotification("Your vote has been reset. You can vote again.");
}

// Get nominee name by ID
function getNomineeName(id) {
  const nominee = nominees.find(n => n.id === parseInt(id));
  return nominee ? nominee.name : 'Unknown';
}

// Show notification
function showNotification(message, isError = false) {
  const notification = document.getElementById('notification');
  notification.textContent = message;
  notification.classList.remove('error');
  
  if (isError) {
      notification.classList.add('error');
  }
  
  notification.classList.add('show');
  
  setTimeout(() => {
      notification.classList.remove('show');
  }, 3000);
}

// Get votes from Vercel Blob Storage via API
async function getVotesFromBlobStorage() {
  try {
      // For demonstration, we'll use localStorage as a fallback
      // In a real implementation, this would fetch from your API endpoint
      const votesJSON = localStorage.getItem('vercelBlobVotes');
      return votesJSON ? JSON.parse(votesJSON) : {};
  } catch (error) {
      console.error('Error fetching votes from blob storage:', error);
      // Fallback to empty votes object
      return {};
  }
}

// Save vote to Vercel Blob Storage via API
async function saveVoteToBlobStorage(nomineeId) {
  try {
      // For demonstration, we'll use localStorage
      // In a real implementation, this would send the vote to your API endpoint
      const votes = JSON.parse(localStorage.getItem('vercelBlobVotes') || '{}');
      votes[nomineeId] = (votes[nomineeId] || 0) + 1;
      localStorage.setItem('vercelBlobVotes', JSON.stringify(votes));
      
      return { success: true };
  } catch (error) {
      console.error('Error saving vote to blob storage:', error);
      throw error;
  }
}