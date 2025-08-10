import { useState, useEffect } from 'react';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3001';

export interface Session {
  _id: string;
  creatorMint: string;
  startTime: string;
  endTime?: string;
  isActive: boolean;
  totalBurns: number;
  participantCount: number;
}

export function useSession(creatorMint: string) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchActiveSession = async () => {
    if (!creatorMint) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`${API_BASE}/sessions/${creatorMint}/active`);
      if (res.status === 404) {
        setSession(null);
      } else if (res.ok) {
        const data = await res.json();
        setSession(data);
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch (err: any) {
      console.error('Error fetching session:', err);
      setError(err.message);
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  const startSession = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`${API_BASE}/sessions/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creatorMint })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to start session');
      }
      
      const newSession = await res.json();
      setSession(newSession);
      return newSession;
    } catch (err: any) {
      console.error('Error starting session:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const endSession = async () => {
    if (!session) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`${API_BASE}/sessions/${session._id}/end`, {
        method: 'POST'
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to end session');
      }
      
      setSession(null);
    } catch (err: any) {
      console.error('Error ending session:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveSession();
  }, [creatorMint]);

  return {
    session,
    loading,
    error,
    startSession,
    endSession,
    refreshSession: fetchActiveSession
  };
}