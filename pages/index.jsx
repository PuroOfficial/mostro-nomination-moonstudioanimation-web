// pages/index.js
import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';

export default function VotingSystem() {
    const [nominees] = useState([
        { id: 1, name: "Moon Studio Animation" },
        { id: 2, name: "Seel" },
        { id: 3, name: "Epic" },
        { id: 4, name: "Pool" },
        { id: 5, name: "Adorable Steve" },
        { id: 6, name: "Mar" },
        { id: 7, name: "JSkript" }
    ]);
    const [selectedNominee, setSelectedNominee] = useState(null);
    const [hasVoted, setHasVoted] = useState(false);
    const [voteCounts, setVoteCounts] = useState({});
    const [countdown, setCountdown] = useState('Loading...');
    const [notification, setNotification] = useState({ message: '', isError: false, show: false });
    const [isMuted, setIsMuted] = useState(false);
    const [countdownDate, setCountdownDate] = useState(null);

    // Refs for audio elements
    const tickSoundRef = useRef(null);
    const warnSoundRef = useRef(null);
    const finalWarnSoundRef = useRef(null);

    // Refs for clock hands
    const secondHandRef = useRef(null);

    useEffect(() => {
        initializeApp();
    }, []);

    const initializeApp = async () => {
        await fetchTimer();
        fetchVoteCounts();
        checkIfVoted();

        // Set up interval for clock updates
        const clockInterval = setInterval(updateClock, 1000);
        return () => clearInterval(clockInterval);
    };

    const fetchTimer = async () => {
        try {
            const response = await fetch('/api/timer');
            const data = await response.json();
            setCountdownDate(new Date(data.startTime));
            startCountdown(new Date(data.startTime));
        } catch (error) {
            console.error('Error fetching timer:', error);
            // Fallback: create new timer
            const fallbackDate = new Date();
            fallbackDate.setDate(fallbackDate.getDate() + 6);
            setCountdownDate(fallbackDate);
            startCountdown(fallbackDate);
        }
    };

    const fetchVoteCounts = async () => {
        try {
            const response = await fetch('/api/votes');
            const data = await response.json();
            setVoteCounts(data);
        } catch (error) {
            console.error('Error fetching vote counts:', error);
            showNotification('Error loading results', true);
        }
    };

    const checkIfVoted = () => {
        if (typeof window !== 'undefined') {
            const voted = localStorage.getItem('hasVoted') === 'true';
            setHasVoted(voted);
        }
    };

    const generateVoterId = () => {
        if (typeof window !== 'undefined') {
            let voterId = localStorage.getItem('voterId');
            if (!voterId) {
                voterId = 'voter-' + Math.random().toString(36).substring(2) + Date.now().toString(36);
                localStorage.setItem('voterId', voterId);
            }
            return voterId;
        }
        return '';
    };

    const submitVote = async () => {
        if (!selectedNominee) {
            showNotification('Please select a nominee first!', true);
            return;
        }

        if (hasVoted) {
            showNotification("You've already voted!", true);
            return;
        }

        try {
            const voterId = generateVoterId();
            const response = await fetch('/api/votes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nomineeId: selectedNominee, voterId })
            });

            const data = await response.json();

            if (response.ok) {
                setHasVoted(true);
                if (typeof window !== 'undefined') {
                    localStorage.setItem('hasVoted', 'true');
                }
                showNotification(`Your vote for ${getNomineeName(selectedNominee)} has been recorded!`);
                setVoteCounts(data); // Update with new counts from server
            } else {
                showNotification(data.error || 'Failed to submit vote', true);
            }
        } catch (error) {
            console.error('Error submitting vote:', error);
            showNotification('Error submitting vote. Please try again.', true);
        }
    };

    const getNomineeName = (id) => {
        const nominee = nominees.find(n => n.id === parseInt(id));
        return nominee ? nominee.name : 'Unknown';
    };

    const showNotification = (message, isError = false) => {
        setNotification({ message, isError, show: true });
        setTimeout(() => {
            setNotification({ message: '', isError: false, show: false });
        }, 3000);
    };

    const startCountdown = (endDate) => {
        let lastSecond = null;

        const updateCountdown = () => {
            const now = new Date();
            const distance = endDate - now;

            if (distance < 0) {
                setCountdown("Voting has ended!");
                return;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            setCountdown(`${days}d ${hours}h ${minutes}m ${seconds}s`);

            // Play sounds based on time remaining
            if (!isMuted) {
                // Play tick sound every second
                if (seconds !== lastSecond && tickSoundRef.current) {
                    playSound(tickSoundRef.current);
                    lastSecond = seconds;
                }

                // Play warning sounds
                if (distance < 60000 && finalWarnSoundRef.current) { // Less than 1 minute
                    playSound(finalWarnSoundRef.current);
                } else if (distance < 86400000 && warnSoundRef.current) { // Less than 24 hours
                    playSound(warnSoundRef.current);
                }
            }
        };

        updateCountdown();
        const countdownInterval = setInterval(updateCountdown, 1000);
        return () => clearInterval(countdownInterval);
    };

    const updateClock = () => {
        const now = new Date();
        const seconds = now.getSeconds();

        // Calculate angle (each second = 6 degrees)
        const secondAngle = seconds * 6;

        // Apply rotation to second hand
        if (secondHandRef.current) {
            secondHandRef.current.style.transform = `translateX(-50%) rotate(${secondAngle}deg)`;
        }
    };

    const playSound = (sound) => {
        if (isMuted || !sound) return;

        try {
            sound.currentTime = 0;
            sound.play().catch(e => console.log("Audio play failed:", e));
        } catch (error) {
            console.log("Error playing sound:", error);
        }
    };

    const toggleMute = () => {
        setIsMuted(!isMuted);
    };

    const resetVote = () => {
        setHasVoted(false);
        setSelectedNominee(null);
        if (typeof window !== 'undefined') {
            localStorage.removeItem('hasVoted');
        }
        showNotification("Your vote has been reset. You can vote again.");
    };

    const refreshResults = () => {
        fetchVoteCounts();
        showNotification("Results refreshed!");
    };

    const totalVotes = Object.values(voteCounts).reduce((sum, count) => sum + count, 0);

    return (
        <div className="container">
            <Head>
                <title>Nomination Parody Voting</title>
                <style>
                    {`
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
            
            * {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            
            h1, h2, h3 {
              font-weight: 600;
            }
            
            .countdown-timer {
              font-family: 'Inter', monospace;
            }
          `}
                </style>
            </Head>

            <header>
                <h1>Nomination Parody Awards</h1>
                <p>Vote for your favorite nominee! Only one vote per person is allowed.</p>
            </header>

            <div className="countdown-banner">
                <div className="countdown-content">
                    <h2>Time remaining to vote:</h2>
                    <div className="countdown-timer">{countdown}</div>
                    <div className="audio-controls">
                        <span>Sound:</span>
                        <button className="mute-btn" onClick={toggleMute}>
                            {isMuted ? 'Unmute' : 'Mute'}
                        </button>
                    </div>
                </div>

                <div className="clock-container">
                    <div className="analog-clock">
                        <div className="clock-hand second-hand" ref={secondHandRef}></div>
                        <div className="clock-center"></div>
                    </div>
                </div>

                {/* Audio elements */}
                <audio ref={tickSoundRef} src="/assets/countdown-tick.wav" preload="auto" />
                <audio ref={warnSoundRef} src="/assets/countdown-warn.wav" preload="auto" />
                <audio ref={finalWarnSoundRef} src="/assets/countdown-warn-final.wav" preload="auto" />
            </div>

            <div className="nominees-grid">
                {nominees.map(nominee => (
                    <div
                        key={nominee.id}
                        className={`nominee-card ${selectedNominee === nominee.id ? 'selected' : ''}`}
                        onClick={() => !hasVoted && setSelectedNominee(nominee.id)}
                    >
                        <h3>{nominee.name}</h3>
                        <p>Click to select</p>
                    </div>
                ))}
            </div>

            <button
                className="vote-btn"
                onClick={submitVote}
                disabled={hasVoted || !selectedNominee}
            >
                {hasVoted ? 'Already Voted' : 'Submit Your Vote'}
            </button>

            <div className="results">
                <h2>Current Results</h2>
                <div>
                    {nominees.map(nominee => {
                        const voteCount = voteCounts[nominee.id] || 0;
                        const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;

                        return (
                            <div
                                key={nominee.id}
                                className="result-bar"
                                style={{ width: `${Math.max(10, percentage)}%` }}
                            >
                                {nominee.name}
                                <span className="vote-count">{voteCount} votes ({percentage}%)</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="admin-section">
                <h2>Admin Functions</h2>
                <button className="admin-btn" onClick={refreshResults}>Refresh Results</button>
                <button className="admin-btn" onClick={resetVote}>Reset My Vote</button>
            </div>

            <footer>
                <p>Voting ends on {countdownDate ? countdownDate.toLocaleDateString() : 'soon'}. Results will be displayed after voting closes.</p>
                <p>Note: This is a parody voting system for entertainment purposes only.</p>
                <p>Storage: Vercel Blob Storage</p>
            </footer>

            <div className={`notification ${notification.show ? 'show' : ''} ${notification.isError ? 'error' : ''}`}>
                {notification.message}
            </div>

            <style jsx>{`
        .container {
          max-width: 1000px;
          margin: 0 auto;
          background: rgba(30, 30, 30, 0.9);
          border-radius: 15px;
          padding: 20px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        }
        
        header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid rgba(255, 255, 255, 0.1);
        }
        
        h1 {
          font-size: 2.8rem;
          margin-bottom: 10px;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
          background: linear-gradient(to right, #ff7e5f, #feb47b);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        
        .countdown-banner {
          background: linear-gradient(to right, #1a2a6c, #b21f1f);
          padding: 15px;
          border-radius: 10px;
          margin: 20px 0;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 4px 15px rgba(178, 31, 31, 0.4);
          position: relative;
          overflow: hidden;
        }
        
        .countdown-content {
          flex: 1;
        }
        
        .countdown-timer {
          font-size: 2rem;
          font-weight: bold;
          letter-spacing: 3px;
          color: #ffcc00;
        }
        
        .clock-container {
          width: 80px;
          height: 80px;
          position: relative;
        }
        
        .analog-clock {
          width: 100%;
          height: 100%;
          border: 3px solid white;
          border-radius: 50%;
          position: relative;
        }
        
        .clock-hand {
          position: absolute;
          bottom: 50%;
          left: 50%;
          transform-origin: bottom center;
          background: white;
          border-radius: 5px;
          transition: transform 0.2s ease-in-out;
        }
        
        .second-hand {
          width: 2px;
          height: 40px;
          margin-left: -1px;
        }
        
        .clock-center {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 8px;
          height: 8px;
          background: white;
          border-radius: 50%;
          transform: translate(-50%, -50%);
        }
        
        .nominees-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 20px;
          margin: 30px 0;
        }
        
        .nominee-card {
          background: rgba(50, 50, 50, 0.8);
          border-radius: 10px;
          padding: 20px;
          text-align: center;
          transition: transform 0.3s, box-shadow 0.3s;
          cursor: pointer;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .nominee-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
          background: rgba(70, 70, 70, 0.8);
        }
        
        .nominee-card.selected {
          background: rgba(100, 150, 255, 0.3);
          box-shadow: 0 0 15px rgba(100, 150, 255, 0.5);
          border-color: rgba(100, 150, 255, 0.5);
        }
        
        .nominee-card h3 {
          margin-bottom: 15px;
          font-size: 1.4rem;
          min-height: 70px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .vote-btn {
          background: linear-gradient(to right, #ff7e5f, #feb47b);
          color: white;
          border: none;
          padding: 15px 30px;
          font-size: 1.2rem;
          border-radius: 50px;
          cursor: pointer;
          margin: 20px auto;
          display: block;
          transition: transform 0.2s, box-shadow 0.2s;
          font-weight: bold;
        }
        
        .vote-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.4);
        }
        
        .vote-btn:disabled {
          background: #444444;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
        
        .results {
          margin-top: 40px;
          background: rgba(40, 40, 40, 0.8);
          padding: 20px;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .result-bar {
          height: 30px;
          background: linear-gradient(to right, #4facfe, #00f2fe);
          margin: 10px 0;
          border-radius: 5px;
          display: flex;
          align-items: center;
          padding: 0 15px;
          color: #000;
          font-weight: bold;
          transition: width 0.5s ease-in-out;
        }
        
        .vote-count {
          margin-left: auto;
        }
        
        footer {
          text-align: center;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 2px solid rgba(255, 255, 255, 0.1);
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.7);
        }
        
        .notification {
          position: fixed;
          top: 20px;
          right: 20px;
          padding: 15px 25px;
          border-radius: 8px;
          background: rgba(0, 200, 0, 0.9);
          color: white;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
          transform: translateX(100%);
          transition: transform 0.3s ease-in-out;
          z-index: 1000;
        }
        
        .notification.show {
          transform: translateX(0);
        }
        
        .notification.error {
          background: rgba(200, 0, 0, 0.9);
        }
        
        .admin-section {
          margin-top: 40px;
          padding: 20px;
          background: rgba(40, 40, 40, 0.8);
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .admin-btn {
          background: linear-gradient(to right, #6a11cb, #2575fc);
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
          margin-right: 10px;
        }
        
        .audio-controls {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 10px;
        }
        
        .mute-btn {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          padding: 5px 10px;
          border-radius: 5px;
          cursor: pointer;
        }
        
        @media (max-width: 768px) {
          .nominees-grid {
            grid-template-columns: 1fr;
          }
          
          h1 {
            font-size: 2rem;
          }
          
          .countdown-banner {
            flex-direction: column;
            gap: 15px;
          }
        }
      `}</style>
        </div>
    );
}