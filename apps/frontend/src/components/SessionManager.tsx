import { useSession } from '../hooks/useSession';

interface Props {
  creatorMint: string;
  creatorName: string;
}

export default function SessionManager({ creatorMint, creatorName }: Props) {
  const { session, loading, error, startSession, endSession } = useSession(creatorMint);

  const handleStart = async () => {
    try {
      await startSession();
    } catch (err) {
      // Error is already handled in useSession
    }
  };

  const handleEnd = async () => {
    try {
      await endSession();
    } catch (err) {
      // Error is already handled in useSession
    }
  };

  return (
    <div style={{ 
      border: '1px solid #ccc', 
      padding: '1rem', 
      margin: '1rem 0', 
      backgroundColor: '#f9f9f9' 
    }}>
      <h3>Session Management - {creatorName}</h3>
      
      {error && (
        <div style={{ color: 'red', marginBottom: '0.5rem' }}>
          Error: {error}
        </div>
      )}

      {session ? (
        <div>
          <div style={{ marginBottom: '1rem' }}>
            <div><strong>Status:</strong>  Live Session Active</div>
            <div><strong>Session ID:</strong> {session._id}</div>
            <div><strong>Started:</strong> {new Date(session.startTime).toLocaleString()}</div>
            <div><strong>Total Burns:</strong> {session.totalBurns}</div>
            <div><strong>Participants:</strong> {session.participantCount}</div>
          </div>
          <button 
            onClick={handleEnd} 
            disabled={loading}
            style={{ 
              backgroundColor: '#dc2626', 
              color: 'white', 
              padding: '0.5rem 1rem' 
            }}
          >
            {loading ? 'Ending...' : 'End Session'}
          </button>
        </div>
      ) : (
        <div>
          <div style={{ marginBottom: '1rem' }}>
            <div><strong>Status:</strong> Offline</div>
            <div>No active session for this creator</div>
          </div>
          <button 
            onClick={handleStart} 
            disabled={loading}
            style={{ 
              backgroundColor: '#16a34a', 
              color: 'white', 
              padding: '0.5rem 1rem' 
            }}
          >
            {loading ? 'Starting...' : 'Start Live Session'}
          </button>
        </div>
      )}
    </div>
  );
}