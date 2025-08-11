import { useState } from 'react';

interface Props {
  creatorMint: string;
  creatorName: string;
  isCurrentlyLive: boolean;
  onToggle?: (newStatus: boolean) => void;
}

export default function DevToggleLive({ creatorMint, creatorName, isCurrentlyLive, onToggle }: Props) {
  const [loading, setLoading] = useState(false);

  const toggleLiveStatus = async () => {
    const newStatus = !isCurrentlyLive;
    
    setLoading(true);
    try {
      const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3001';
      
      const response = await fetch(`${API_BASE}/creators/${creatorMint}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isLive: newStatus
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update creator status');
      }

      const result = await response.json();
      console.log('✅ Creator status updated:', result);
      
      onToggle?.(newStatus);
      
      // Refresh the page to update the UI
      setTimeout(() => window.location.reload(), 1000);

    } catch (error) {
      console.error('Error updating creator status:', error);
      alert(`Error updating creator status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'inline-block',
      marginLeft: '0.5rem'
    }}>
      <button
        onClick={toggleLiveStatus}
        disabled={loading}
        style={{
          backgroundColor: isCurrentlyLive 
            ? (loading ? '#9ca3af' : '#dc2626') 
            : (loading ? '#9ca3af' : '#059669'),
          color: 'white',
          border: 'none',
          padding: '0.25rem 0.75rem',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: '0.8em',
          fontWeight: 'bold'
        }}
        title={`Click to set ${creatorName} as ${isCurrentlyLive ? 'OFFLINE' : 'LIVE'}`}
      >
        {loading 
          ? '...' 
          : (isCurrentlyLive ? '🔴 Set OFFLINE' : '🟢 Set LIVE')
        }
      </button>
    </div>
  );
}