import { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction } from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createBurnInstruction,
  getMint,
} from '@solana/spl-token';

type Props = {
  creatorMint: string; // base58 mint
  sessionId?: string;
};

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3001';

export default function BurnPanel({ creatorMint, sessionId }: Props) {
  const [amountUi, setAmountUi] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();

  const handleBurn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey) return;

    try {
      setStatus('Preparing burn...');
      const mintPk = new PublicKey(creatorMint);

      // decimals
      const mintInfo = await getMint(connection, mintPk);
      const decimals = mintInfo.decimals;

      const ui = Number(amountUi);
      if (!Number.isFinite(ui) || ui <= 0) {
        setStatus('Enter a valid amount > 0');
        return;
      }
      const baseUnits = BigInt(Math.floor(ui * 10 ** decimals));

      // ATA + burn ix
      const ata = await getAssociatedTokenAddress(mintPk, publicKey);
      const ix = createBurnInstruction(ata, mintPk, publicKey, baseUnits);

      const tx = new Transaction().add(ix);
      const sig = await sendTransaction(tx, connection, { skipPreflight: false });

      // Log to backend
      const burnPayload: any = {
        creatorMint,
        wallet: publicKey.toBase58(),
        amount: ui, // Decimal128/txSig verification will come in Patch 2
      };

      if (sessionId) {
        burnPayload.sessionId = sessionId;
      }

      await fetch(`${API_BASE}/burns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(burnPayload),
      });

      setStatus(`Sent: ${sig}`);
      setAmountUi('');
    } catch (err: any) {
      console.error('Burn error:', err);
      setStatus(`Error: ${err.message ?? String(err)}`);
    }
  };

  return (
    <form onSubmit={handleBurn} style={{ marginTop: '1rem' }}>
      <h4>Burn Creator Token</h4>
      <div>
        <input
          type="number"
          step="any"
          placeholder="Amount to burn"
          value={amountUi}
          onChange={(e) => setAmountUi(e.target.value)}
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
