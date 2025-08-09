import React, { useEffect, useState } from 'react';
import CreatorList, { Creator } from './components/CreatorList';
import Leaderboard from './components/Leaderboard';
import BurnPanel from './components/BurnPanel';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { getTokenBalance } from './utils/getTokenBalance';
import { PublicKey } from '@solana/web3.js';

function App() {
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [balance, setBalance] = useState<number | null>(null);

  const { publicKey } = useWallet();
  const { connection } = useConnection();

  useEffect(() => {
    const mint = selectedCreator?.mint;
    if (publicKey && mint) {
      getTokenBalance(connection, publicKey, new PublicKey(mint))
        .then(setBalance)
        .catch(err => console.error('Error fetching token balance:', err));
    } else {
      setBalance(null);
    }
  }, [publicKey, connection, selectedCreator?.mint]);

  const overlayUrl = selectedCreator
    ? `${window.location.origin}/overlay?creatorMint=${encodeURIComponent(selectedCreator.mint)}`
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

      <CreatorList onSelect={setSelectedCreator} />

      {selectedCreator && (
        <>
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
              <button onClick={() => navigator.clipboard.writeText(overlayUrl)}>Copy</button>
            </div>
          </div>

          {/* Optional: show user balance for selected creator */}
          {balance !== null && (
            <div style={{ marginBottom: '0.5rem' }}>
              Balance: {balance}
            </div>
          )}

          <Leaderboard creatorMint={selectedCreator.mint} />
          <BurnPanel creatorMint={selectedCreator.mint} />
        </>
      )}
    </div>
  );
}

export default App;
