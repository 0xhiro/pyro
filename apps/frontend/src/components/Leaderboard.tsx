import { useEffect, useState } from 'react';

type LeaderboardEntry = {
  rank?: number;
  wallet: string;
  totalBurned: number;
};

type Props = {
  creatorMint: string;
  sessionId?: string;
};

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3001';

export default function Leaderboard({ creatorMint, sessionId }: Props) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const url = sessionId 
      ? `${API_BASE}/leaderboard/${creatorMint}/session/${sessionId}`
      : `${API_BASE}/leaderboard/${creatorMint}`;
      
    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch leaderboard');
        return res.json();
      })
      .then(data => setEntries(data))
      .catch(err => setError(err.message));
  }, [creatorMint, sessionId]);

  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      <h3>Leaderboard {sessionId ? '(Session)' : '(All-Time)'}</h3>
      {sessionId && (
        <div style={{ fontSize: '0.9em', marginBottom: '0.5rem', color: '#059669' }}>
          Live session leaderboard
        </div>
      )}
      <ul>
        {entries.map((entry, i) => (
          <li key={entry.wallet}>
            #{entry.rank ?? i + 1} <strong>{entry.wallet}</strong>: {entry.totalBurned}
          </li>
        ))}
      </ul>
    </div>
  );
}
