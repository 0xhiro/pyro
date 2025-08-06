import { useState } from 'react';

type Props = {
  creatorId: string;
};

export default function BurnPanel({ creatorId }: Props) {
  const [wallet, setWallet] = useState('');
  const [amount, setAmount] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    fetch('http://localhost:3001/burns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creatorId,
        wallet,
        amount: parseFloat(amount),
      }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error('Failed to submit burn');
        }
        return res.json();
      })
      .then((data) => {
        console.log('✅ Burn submitted:', data);
        setWallet('');
        setAmount('');
      })
      .catch((err) => {
        console.error('❌ Burn failed:', err);
      });
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: '1rem' }}>
      <h4>Simulate Burn</h4>
      <div>
        <input
          type="text"
          placeholder="Wallet address"
          value={wallet}
          onChange={(e) => setWallet(e.target.value)}
          required
          style={{ width: '300px', marginBottom: '0.5rem' }}
        />
      </div>
      <div>
        <input
          type="number"
          placeholder="Amount to Burn"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          style={{ width: '150px', marginBottom: '0.5rem' }}
        />
      </div>
      <button type="submit">Submit Dummy Burn</button>
    </form>
  );
}

