import React, { useEffect, useState } from 'react';
import { PublicKey } from '@solana/web3.js';
import { TokenListProvider } from '@solana/spl-token-registry';

const RPC_ENDPOINT = 'https://mainnet.helius-rpc.com/?api-key=e52b7e28-596b-48c2-abaa-10f5dd653e72';

export type Creator = {
  id: string;
  name: string;
  tokenMint: string;
};

type Props = {
  onSelect: (creator: Creator) => void;
};

export default function CreatorList({ onSelect }: Props) {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [mintInput, setMintInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // load existing creators
  useEffect(() => {
    fetch('http://localhost:3001/creators')
      .then((res) => res.json())
      .then((data: Creator[]) => setCreators(data))
      .catch((err) => console.error('Failed to fetch creators:', err));
  }, []);

  const handleAddToken = async () => {
    setLoading(true);
    setError(null);
    try {
      const pubkey = new PublicKey(mintInput.trim());

      // lookup in the on-chain token registry
      const provider = new TokenListProvider();
      const container = await provider.resolve();
      const tokenList = container.filterByChainId(101).getList();
      const info = tokenList.find((t) => t.address === pubkey.toBase58());

      const name = info ? info.name : 'Custom Token';
      const symbol = info ? info.symbol : '';
      const displayName = symbol ? `${name} (${symbol})` : name;

      const newCreator: Creator = {
        id: pubkey.toBase58(),
        name: displayName,
        tokenMint: pubkey.toBase58(),
      };

      // persist to backend
      const res = await fetch('http://localhost:3001/creators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCreator),
      });
      if (!res.ok) throw new Error('Failed to save creator');

      // append locally
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
          key={creator.id}                        // ← Unique key prop!
          onClick={() => onSelect(creator)}
          style={{ cursor: 'pointer', marginBottom: '10px' }}
        >
          <strong>{creator.name}</strong>
          <br />
          <small>{creator.tokenMint}</small>
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
