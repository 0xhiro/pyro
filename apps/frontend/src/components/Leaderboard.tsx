import { useEffect, useState } from 'react';

type LeaderboardEntry = {
  rank?: number;
  wallet: string;
  totalBurned: number;
};

type Props = {
  creatorMint: string;
};

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3001';

export default function Leaderboard({ creatorMint }: Props) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/leaderboard/${creatorMint}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch leaderboard');
        return res.json();
      })
      .then(data => setEntries(data))
      .catch(err => setError(err.message));
  }, [creatorMint]);

  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      <h3>Leaderboard</h3>
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
