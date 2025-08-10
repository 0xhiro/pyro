import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3001';

interface Props {
  creatorMint: string;
  sessionId?: string;
}

export default function TestBurnPanel({ creatorMint, sessionId }: Props) {
  const [amountUi, setAmountUi] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const { publicKey } = useWallet();

  const handleTestBurn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey) {
      setStatus('❌ Please connect your wallet first');
      return;
    }

    const amount = Number(amountUi);
    if (!Number.isFinite(amount) || amount <= 0) {
      setStatus('❌ Enter a valid amount > 0');
      return;
    }

    try {
      setStatus('🔄 Simulating burn...');

      // Simulate the burn by calling backend directly (skip blockchain)
      const burnPayload: any = {
        creatorMint,
        wallet: publicKey.toBase58(),
        amount: amount,
      };

      if (sessionId) {
        burnPayload.sessionId = sessionId;
      }

      const burnRes = await fetch(`${API_BASE}/burns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(burnPayload),
      });

      if (!burnRes.ok) {
        const errorData = await burnRes.json();
        throw new Error(errorData.error || 'Failed to log burn');
      }

      const burnData = await burnRes.json();
      
      setStatus(`✅ Test burn successful! Amount: ${amount} | Protocol fee: ${burnData.protocolFee || 0} | Check leaderboard!`);
      setAmountUi('');
      
    } catch (err: any) {
      console.error('Test burn error:', err);
      setStatus(`❌ Error: ${err.message}`);
    }
  };

  return (
    <div style={{
      border: '2px solid #f59e0b',
      backgroundColor: '#fef3c7',
      padding: '1rem',
      borderRadius: '8px',
      marginBottom: '1rem'
    }}>
      <h4>🧪 Test Burn (Simulation)</h4>
      <p style={{ fontSize: '0.9em', marginBottom: '1rem', color: '#92400e' }}>
        This simulates burning
      </p>

      {sessionId ? (
        <div style={{ marginBottom: '0.5rem', fontSize: '0.9em', color: '#059669' }}>
          Live session active - test burns will count towards leaderboard
        </div>
      ) : (
        <div style={{ marginBottom: '0.5rem', fontSize: '0.9em', color: '#dc2626' }}>
          No active session - test burns won't affect leaderboard
        </div>
      )}

      <form onSubmit={handleTestBurn} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.9em', marginBottom: '0.25rem' }}>
            Amount to "burn":
          </label>
          <input
            type="number"
            step="any"
            placeholder="Amount"
            value={amountUi}
            onChange={(e) => setAmountUi(e.target.value)}
            required
            style={{ 
              width: '120px', 
              padding: '0.5rem',
              border: '1px solid #d97706',
              borderRadius: '4px'
            }}
          />
        </div>
        <button 
          type="submit" 
          disabled={!publicKey}
          style={{
            backgroundColor: '#f59e0b',
            color: 'white',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            cursor: publicKey ? 'pointer' : 'not-allowed'
          }}
        >
          Test Burn
        </button>
      </form>

      {status && (
        <div style={{ 
          marginTop: '0.5rem', 
          padding: '0.5rem',
          backgroundColor: 'white',
          borderRadius: '4px',
          fontSize: '0.9em',
          wordBreak: 'break-all'
        }}>
          {status}
        </div>
      )}
    </div>
  );
}