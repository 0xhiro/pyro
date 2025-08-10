import React, { useEffect, useState } from 'react';
import CreatorList, { Creator } from './components/CreatorList';
import Leaderboard from './components/Leaderboard';
import BurnPanel from './components/BurnPanel';
import SessionManager from './components/SessionManager';
import DevMintButton from './components/DevMintButton';
import DevAddCreator from './components/DevAddCreator';
import DevBurnButton from './components/DevBurnButton';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { getTokenBalance } from './utils/getTokenBalance';
import { useSession } from './hooks/useSession';
import { PublicKey } from '@solana/web3.js';

function App() {
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [balance, setBalance] = useState<number | null>(null);

  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const { session } = useSession(selectedCreator?.mint || '');

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

      <DevMintButton 
        onTokenMinted={(mintAddress, amount) => {
          console.log(`Minted ${amount} tokens at ${mintAddress}`);
        }}
      />
      
      <DevAddCreator 
        onCreatorAdded={(mintAddress) => {
          console.log(`Creator added with mint: ${mintAddress}`);
          // Refresh the creator list
          window.location.reload();
        }}
      />
      
      <CreatorList onSelect={setSelectedCreator} />

      {selectedCreator && (
        <>
          <div style={{ 
            border: '2px solid #0ea5e9', 
            padding: '1rem', 
            margin: '1rem 0',
            backgroundColor: '#f0f9ff',
            borderRadius: '8px'
          }}>
            <h2>Selected Creator: {selectedCreator.name}</h2>
            <div style={{ fontFamily: 'monospace', fontSize: '0.9em', marginBottom: '0.5rem' }}>
              {selectedCreator.mint}
            </div>
            <div style={{ 
              color: selectedCreator.isLive ? '#059669' : '#dc2626',
              fontWeight: 'bold',
              fontSize: '1.1em'
            }}>
              {selectedCreator.isLive ? ' LIVE' : ' OFFLINE'}
            </div>
          </div>

          <SessionManager 
            creatorMint={selectedCreator.mint} 
            creatorName={selectedCreator.name}
          />

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
              Token Balance: {balance}
            </div>
          )}

          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            <div style={{ flex: '1', minWidth: '300px' }}>
              <Leaderboard 
                creatorMint={selectedCreator.mint} 
                sessionId={session?._id}
              />
            </div>
            <div style={{ flex: '1', minWidth: '300px' }}>
              <DevBurnButton 
                creatorMint={selectedCreator.mint} 
                sessionId={session?._id}
              />

              <BurnPanel 
                creatorMint={selectedCreator.mint} 
                sessionId={session?._id}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
