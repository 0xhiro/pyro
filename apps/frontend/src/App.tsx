import React, { useEffect, useState } from 'react';
import CreatorList from './components/CreatorList';
import Leaderboard from './components/Leaderboard';
import BurnPanel from './components/BurnPanel';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { getTokenBalance } from './utils/getTokenBalance';
import { PublicKey } from '@solana/web3.js';

function App() {
  const [selectedCreatorId, setSelectedCreatorId] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);

  const { publicKey } = useWallet();
  const { connection } = useConnection();

  // TEMP: hardcoded token mint for demo
  const tokenMint = new PublicKey('45zyjKJ7Aqu8iofWEm5GuSAkY7eJ3sLMAbPeY96Apump');

  useEffect(() => {
    if (publicKey) {
      getTokenBalance(connection, publicKey, tokenMint)
        .then(setBalance)
        .catch(err => console.error('Error fetching token balance:', err));
    }
  }, [publicKey, connection]);

  const overlayUrl = selectedCreatorId
    ? `${window.location.origin}/overlay?creatorId=${encodeURIComponent(selectedCreatorId)}`
    : '';

  return (
    <div>
      <h1>Pyro Demo</h1>

      <div style={{ marginBottom: '1rem' }}>
        <WalletMultiButton />
      </div>

      {publicKey && (
        <div style={{ marginBottom: '1rem' }}>
          <strong>Wallet:</strong> {publicKey.toBase58()}
        </div>
      )}

      <CreatorList onSelect={(creator) => setSelectedCreatorId(creator.id)} />

      {selectedCreatorId && (
        <>
          {/* Overlay URL block */}
          <div style={{ margin: '10px 0' }}>
            <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>
              Overlay URL (copy into OBS/Restream):
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                readOnly
                value={overlayUrl}
                style={{ width: '100%', maxWidth: 520 }}
                onFocus={(e) => e.currentTarget.select()}
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(overlayUrl);
                }}
              >
                Copy
              </button>
            </div>
          </div>

          <Leaderboard creatorId={selectedCreatorId} />
          <BurnPanel creatorId={selectedCreatorId} />
        </>
      )}
    </div>
  );
}

export default App;
