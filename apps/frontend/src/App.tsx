import React, { useState } from 'react';
import CreatorList from './components/CreatorList';
import Leaderboard from './components/Leaderboard';
import BurnPanel from './components/BurnPanel';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';

function App() {
  const [selectedCreatorId, setSelectedCreatorId] = useState<string | null>(null);
  const { publicKey } = useWallet();

  return (
    <div>
      <h1>Pyro Demo</h1>

      <div style={{ marginBottom: '1rem' }}>
        <WalletMultiButton />
        {publicKey && <p>Connected wallet: {publicKey.toBase58()}</p>}
      </div>

      <CreatorList onSelect={setSelectedCreatorId} />

      {selectedCreatorId && (
        <>
          <Leaderboard creatorId={selectedCreatorId} />
          <BurnPanel creatorId={selectedCreatorId} />
        </>
      )}
    </div>
  );
}

export default App;
