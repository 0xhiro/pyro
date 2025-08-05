import { useEffect, useState } from 'react';

type LeaderboardEntry = {
  wallet: string;
  totalBurned: number;
};

type Props = {
  creatorId: string;
};

export default function Leaderboard({ creatorId }: Props) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`http://localhost:3001/leaderboard/${creatorId}`)
      .then(res => {
        if (!res.ok) {
          throw new Error('Failed to fetch leaderboard');
        }
        return res.json();
      })
      .then(data => setEntries(data))
      .catch(err => setError(err.message));
  }, [creatorId]);

  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      <h3>Leaderboard</h3>
      <ul>
        {entries.map((entry, i) => (
          <li key={i}>
            <strong>{entry.wallet}</strong>: {entry.totalBurned} SOL
          </li>
        ))}
      </ul>
    </div>
  );
}
