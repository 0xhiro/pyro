import { useState } from 'react';
import CreatorList from './components/CreatorList';
import Leaderboard from './components/Leaderboard';

function App() {
  const [selectedCreator, setSelectedCreator] = useState<string | null>(null);

  return (
    <div className="App" style={{ padding: '2rem' }}>
      <h1>Pyro Demo</h1>
      <CreatorList onSelect={setSelectedCreator} />
      {selectedCreator && (
        <>
          <hr />
          <Leaderboard creatorId={selectedCreator} />
        </>
      )}
    </div>
  );
}

export default App;
