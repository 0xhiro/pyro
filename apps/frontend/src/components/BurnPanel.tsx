import { useState } from 'react';

type Props = {
  creatorId: string;
};

export default function BurnPanel({ creatorId }: Props) {
  const [wallet, setWallet] = useState('');
  const [amount, setAmount] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔥 Dummy burn submitted:');
    console.log(`Creator: ${creatorId}`);
    console.log(`Wallet: ${wallet}`);
    console.log(`Amount: ${amount} SOL`);
    setWallet('');
    setAmount('');
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
          placeholder="Amount in SOL"
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
