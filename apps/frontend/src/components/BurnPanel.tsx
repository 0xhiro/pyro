import { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction } from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createBurnInstruction,
} from '@solana/spl-token';

type Props = {
  creatorId: string;
};

export default function BurnPanel({ creatorId }: Props) {
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();

  // TEMP: hardcoded token mint for demo
  const tokenMint = new PublicKey('45zyjKJ7Aqu8iofWEm5GuSAkY7eJ3sLMAbPeY96Apump');

  const handleBurn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey) return;

    setStatus('Preparing burn...');

    try {
      const ata = await getAssociatedTokenAddress(tokenMint, publicKey);

      // Dynamically fetch token decimals
      const mintInfo = await connection.getParsedAccountInfo(tokenMint);
      const decimals =
        (mintInfo.value?.data as any)?.parsed?.info?.decimals ?? 0;

      const burnAmount = Number(amount) * 10 ** decimals;

      const burnIx = createBurnInstruction(
        ata,
        tokenMint,
        publicKey,
        burnAmount
      );

      const tx = new Transaction().add(burnIx);
      const sig = await sendTransaction(tx, connection);

      // ✅ Log burn to backend
      await fetch('http://localhost:3001/burns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorId,
          wallet: publicKey.toBase58(),
          amount: Number(amount),
        }),
      });

      setStatus(`✅ Sent! Tx: ${sig}`);
      setAmount('');
    } catch (err: any) {
      console.error('Burn error:', err);
      setStatus(`❌ Error: ${err.message}`);
    }
  };

  return (
    <form onSubmit={handleBurn} style={{ marginTop: '1rem' }}>
      <h4>Burn Creator Token</h4>

      <div>
        <input
          type="number"
          placeholder="Amount to burn"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          style={{ width: '150px', marginBottom: '0.5rem' }}
        />
      </div>

      <button type="submit" disabled={!publicKey}>
        Burn from Connected Wallet
      </button>

      {status && <p>{status}</p>}
    </form>
  );
}
