import { useEffect, useState } from 'react';

type Creator = {
  id: string;
  name: string;
  tokenMint: string;
};

export default function CreatorList() {
  const [creators, setCreators] = useState<Creator[]>([]);

  useEffect(() => {
    fetch('http://localhost:3001/creators')
      .then(res => res.json())
      .then(data => setCreators(data));
  }, []);

  return (
    <div>
      <h2>Creators</h2>
      {creators.map((creator) => (
        <div key={creator.id} onClick={() => console.log(`Clicked: ${creator.id}`)} style={{ marginBottom: '10px' }}>
          <strong>{creator.name}</strong><br />
          <small>{creator.tokenMint}</small>
        </div>
      ))}
    </div>
  );
}
