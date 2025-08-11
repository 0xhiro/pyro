import { useEffect, useRef, useState } from 'react';

export type LeaderboardRow = {
  rank?: number;
  wallet: string;
  totalBurned: number; // backend currently returns number
};

type Options = { limit?: number; intervalMs?: number };

export function useLeaderboard(creatorId: string, opts: Options & { sessionId?: string } = {}) {
  const limit = opts.limit ?? 3;
  const intervalMs = opts.intervalMs ?? 5000;
  const sessionId = opts.sessionId;
  const [entries, setEntries] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3001';

  useEffect(() => {
    let abort = new AbortController();

    async function tick() {
      try {
        setError(null);
        const url = sessionId 
          ? `${API_BASE}/leaderboard/${creatorId}?limit=${limit}&sessionId=${sessionId}&useBlockchain=true`
          : `${API_BASE}/leaderboard/${creatorId}?limit=${limit}&useBlockchain=true`;
          
        const res = await fetch(url, {
          signal: abort.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        // Backend returns { leaderboard: [...], session: {...}, creatorMint: "..." }
        const leaderboardData = data.leaderboard || [];
        setEntries(Array.isArray(leaderboardData) ? leaderboardData : []);
      } catch (e: any) {
        if (e.name !== 'AbortError') setError(e.message ?? 'Fetch failed');
      } finally {
        setLoading(false);
      }
    }

    // initial + interval
    tick();
    timerRef.current = window.setInterval(tick, intervalMs);

    return () => {
      abort.abort();
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [API_BASE, creatorId, limit, intervalMs, sessionId]);

  return { entries, loading, error };
}
