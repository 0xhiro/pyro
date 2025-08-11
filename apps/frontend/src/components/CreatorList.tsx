import React, { useEffect, useState } from 'react';
import { PublicKey } from '@solana/web3.js';
import { TokenListProvider } from '@solana/spl-token-registry';
import DevToggleLive from './DevToggleLive';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3001';

export type Creator = {
  mint: string;   // <- normalized
  name: string;
  isLive?: boolean;
};

type Props = {
  onSelect: (creator: Creator) => void;
};

export default function CreatorList({ onSelect }: Props) {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [mintInput, setMintInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/creators`)
      .then((res) => res.json())
      .then((data) => {
        // Map server docs to { mint, name, isLive }
        const mapped = (data || []).map((c: any) => ({
          mint: c._id || c.mint || c.tokenMint || c.id,
          name: c.name,
          isLive: c.isLive || false,
        }));
        setCreators(mapped);
      })
      .catch((err) => console.error('Failed to fetch creators:', err));
  }, []);

  const handleAddToken = async () => {
    setLoading(true);
    setError(null);
    try {
      const pubkey = new PublicKey(mintInput.trim());

      const provider = new TokenListProvider();
      const container = await provider.resolve();
      const tokenList = container.filterByChainId(101).getList();
      const info = tokenList.find((t) => t.address === pubkey.toBase58());

      const name = info ? info.name : 'Custom Token';
      const symbol = info ? info.symbol : '';
      const displayName = symbol ? `${name} (${symbol})` : name;

      const newCreator: Creator = {
        mint: pubkey.toBase58(),
        name: displayName,
        isLive: false,
      };

      const res = await fetch(`${API_BASE}/creators`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mint: newCreator.mint, name: newCreator.name }),
      });
      if (!res.ok) throw new Error('Failed to save creator');

      setCreators((prev) => [...prev, newCreator]);
      setMintInput('');
    } catch (err: any) {
      console.error('Invalid token mint or save failed:', err);
      setError('Invalid token mint or save failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Creators</h2>

      {creators.map((creator) => (
        <div
          key={creator.mint}
          onClick={() => onSelect(creator)}
          style={{ 
            cursor: 'pointer', 
            marginBottom: '10px',
            padding: '0.5rem',
            border: '1px solid #ccc',
            borderRadius: '4px',
            backgroundColor: creator.isLive ? '#f0f9ff' : '#f9f9f9'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>{creator.name}</strong>
              <br />
              <small style={{ fontFamily: 'monospace' }}>{creator.mint}</small>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ 
                color: creator.isLive ? '#059669' : '#6b7280',
                fontWeight: 'bold',
                fontSize: '0.9em',
                marginRight: '0.5rem'
              }}>
                {creator.isLive ? ' LIVE' : 'OFFLINE'}
              </div>
              <DevToggleLive 
                creatorMint={creator.mint}
                creatorName={creator.name}
                isCurrentlyLive={creator.isLive || false}
              />
            </div>
          </div>
        </div>
      ))}

      <div style={{ marginTop: '1rem' }}>
        <input
          type="text"
          placeholder="Paste token mint (CA)"
          value={mintInput}
          onChange={(e) => setMintInput(e.target.value)}
          style={{ width: '300px', marginRight: '0.5rem' }}
        />
        <button onClick={handleAddToken} disabled={loading || !mintInput}>
          {loading ? 'Adding...' : 'Add Token'}
        </button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </div>
    </div>
  );
}
