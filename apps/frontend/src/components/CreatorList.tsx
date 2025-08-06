import { useEffect, useState } from 'react';
import { PublicKey, Connection } from '@solana/web3.js';
import { TokenListProvider } from '@solana/spl-token-registry';

const connection = new Connection(
  'https://mainnet.helius-rpc.com/?api-key=e52b7e28-596b-48c2-abaa-10f5dd653e72'
);

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

  useEffect(() => {
    fetch('http://localhost:3001/creators')
      .then((res) => res.json())
      .then((data) => setCreators(data));
  }, []);

  const handleAddToken = async () => {
    try {
      setLoading(true);
      setError(null);

      const pubkey = new PublicKey(mintInput);
      let name = 'Custom Token';
      let symbol = '';

      // Look up in the on-chain token registry
      try {
        const provider = new TokenListProvider();
        const container = await provider.resolve();
        const tokenList = container
          .filterByChainId(101) // 101 == mainnet-beta
          .getList();
        const info = tokenList.find((t) => t.address === pubkey.toBase58());
        if (info) {
          name = info.name;
          symbol = info.symbol;
        }
      } catch (registryErr) {
        console.warn('Token registry lookup failed, falling back to default', registryErr);
      }

      const displayName = symbol ? `${name} (${symbol})` : name;

      const newCreator: Creator = {
        id: pubkey.toBase58(),
        name: displayName,
        tokenMint: pubkey.toBase58(),
      };

      setCreators((prev) => [...prev, newCreator]);
      setMintInput('');
    } catch (err: any) {
      console.error('Invalid token mint:', err);
      setError('Invalid token mint or unable to fetch.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Creators</h2>
      {creators.map((creator) => (
        <div
          key={creator.id}
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
