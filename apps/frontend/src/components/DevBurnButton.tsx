import { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
  createBurnInstruction,
  getMint,
  getAccount,
  TokenAccountNotFoundError,
} from '@solana/spl-token';

type Props = {
  creatorMint: string;
  sessionId?: string;
};

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3001';
const BURN_ADDRESS = '11111111111111111111111111111112';

export default function DevBurnButton({ creatorMint, sessionId }: Props) {
  const [amountUi, setAmountUi] = useState('12');
  const [status, setStatus] = useState<string | null>(null);
  const [burnMethod, setBurnMethod] = useState<'burn' | 'transfer'>('transfer');
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();

  const handleBurn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey) {
      setStatus('❌ Please connect your wallet first');
      return;
    }

    try {
      setStatus('🔄 Preparing burn transaction...');
      const mintPk = new PublicKey(creatorMint);
      const burnPk = new PublicKey(BURN_ADDRESS);

      const ui = Number(amountUi);
      if (!Number.isFinite(ui) || ui <= 0) {
        setStatus('❌ Enter a valid amount > 0');
        return;
      }

      let transaction: Transaction;
      let decimals = 0;

      try {
        // Try to get mint info to determine decimals
        const mintInfo = await getMint(connection, mintPk);
        decimals = mintInfo.decimals;
        console.log(`✅ Mint found with ${decimals} decimals`);
      } catch (error) {
        if (error instanceof TokenAccountNotFoundError) {
          setStatus(`❌ Token mint ${creatorMint.slice(0, 8)}... not found on blockchain. Steps to fix:
1. Use the "Dev: Create Token" button to create this token on blockchain
2. Mint some tokens to your wallet
3. Then come back to burn them`);
          return;
        }
        console.warn('Could not get mint info, assuming 0 decimals:', error);
        decimals = 0;
      }

      const baseUnits = BigInt(Math.floor(ui * 10 ** decimals));
      
      if (burnMethod === 'burn') {
        // Method 1: Use proper burn instruction (more standard)
        setStatus('🔥 Creating burn instruction...');
        const ata = await getAssociatedTokenAddress(mintPk, publicKey);
        
        try {
          // Check if token account exists
          await getAccount(connection, ata);
          const burnIx = createBurnInstruction(ata, mintPk, publicKey, baseUnits);
          transaction = new Transaction().add(burnIx);
        } catch (error) {
          setStatus('❌ You don\'t have any tokens to burn or token account doesn\'t exist');
          return;
        }
      } else {
        // Method 2: Transfer to burn address (like your Solscan transaction)
        setStatus('🔄 Creating transfer to burn address...');
        const fromAta = await getAssociatedTokenAddress(mintPk, publicKey);
        const toAta = await getAssociatedTokenAddress(mintPk, burnPk);
        
        try {
          // Check if source account exists
          await getAccount(connection, fromAta);
          
          // Create transfer instruction to burn address
          const transferIx = createTransferInstruction(
            fromAta,
            toAta, 
            publicKey,
            baseUnits
          );
          
          transaction = new Transaction().add(transferIx);
        } catch (error) {
          setStatus('❌ You don\'t have any tokens to burn or token account doesn\'t exist');
          return;
        }
      }

      setStatus('📝 Sending transaction...');
      const signature = await sendTransaction(transaction, connection, { 
        skipPreflight: false,
        preflightCommitment: 'confirmed'
      });

      setStatus('⏳ Confirming transaction...');
      
      // Wait for confirmation
      const confirmation = await connection.confirmTransaction(signature, 'confirmed');
      
      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
      }

      // Log to backend
      const burnPayload: any = {
        creatorMint,
        wallet: publicKey.toBase58(),
        amount: ui,
        signature: signature, // Include signature for verification
      };

      if (sessionId) {
        burnPayload.sessionId = sessionId;
      }

      setStatus('💾 Logging burn to backend...');
      
      try {
        await fetch(`${API_BASE}/burns`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(burnPayload),
        });
      } catch (backendError) {
        console.warn('Failed to log to backend:', backendError);
        // Don't fail the whole operation if backend logging fails
      }

      setStatus(`✅ Burn successful! TX: ${signature.slice(0, 8)}...${signature.slice(-8)}`);
      console.log('🔥 Burn transaction successful:', signature);
      console.log('🔍 View on Solscan:', `https://solscan.io/tx/${signature}?cluster=devnet`);
      
      // Clear form
      setAmountUi('');
      
    } catch (err: any) {
      console.error('Burn error:', err);
      setStatus(`❌ Error: ${err.message || String(err)}`);
    }
  };

  return (
    <div style={{
      border: '2px solid #dc2626',
      backgroundColor: '#fef2f2',
      padding: '1rem',
      borderRadius: '8px',
      marginBottom: '1rem'
    }}>
      <h4>🔥 Dev Burn Button (Blockchain)</h4>
      <p style={{ fontSize: '0.9em', marginBottom: '1rem', color: '#991b1b' }}>
        Make real blockchain burn transactions for testing
      </p>
      
      <div style={{ 
        backgroundColor: '#dbeafe', 
        border: '1px solid #3b82f6',
        padding: '0.75rem',
        borderRadius: '6px',
        marginBottom: '1rem',
        fontSize: '0.85em'
      }}>
        <strong>💡 To test burns:</strong>
        <ol style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.2rem' }}>
          <li>Use <strong>"🚀 Dev Tools - Mint Test Tokens"</strong> button above to create a NEW token</li>
          <li>Select the newly created creator from the list</li>
          <li>Then use this burn button to test burns</li>
        </ol>
        <div style={{ marginTop: '0.5rem', fontSize: '0.9em', fontStyle: 'italic' }}>
          Existing creators in the list don't have blockchain tokens yet - they're just database entries.
        </div>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9em', fontWeight: 'bold' }}>
          Burn Method:
        </label>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <label>
            <input
              type="radio"
              value="transfer"
              checked={burnMethod === 'transfer'}
              onChange={(e) => setBurnMethod(e.target.value as 'transfer')}
            />
            <span style={{ marginLeft: '0.5rem' }}>Transfer to Burn Address (like your Solscan TX)</span>
          </label>
          <label>
            <input
              type="radio"
              value="burn"
              checked={burnMethod === 'burn'}
              onChange={(e) => setBurnMethod(e.target.value as 'burn')}
            />
            <span style={{ marginLeft: '0.5rem' }}>SPL Token Burn Instruction</span>
          </label>
        </div>
      </div>

      <form onSubmit={handleBurn} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.9em', marginBottom: '0.25rem', fontWeight: 'bold' }}>
            Amount to burn:
          </label>
          <input
            type="number"
            step="any"
            placeholder="Amount"
            value={amountUi}
            onChange={(e) => setAmountUi(e.target.value)}
            required
            style={{ 
              width: '120px', 
              padding: '0.5rem',
              border: '1px solid #dc2626',
              borderRadius: '4px'
            }}
          />
        </div>
        <button 
          type="submit" 
          disabled={!publicKey}
          style={{
            backgroundColor: '#dc2626',
            color: 'white',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            cursor: publicKey ? 'pointer' : 'not-allowed',
            fontWeight: 'bold'
          }}
        >
          🔥 BURN
        </button>
      </form>

      {burnMethod === 'transfer' && (
        <div style={{ 
          marginTop: '0.5rem', 
          padding: '0.5rem',
          backgroundColor: '#ddd6fe',
          borderRadius: '4px',
          fontSize: '0.8em',
          border: '1px solid #8b5cf6'
        }}>
          ℹ️ This method transfers tokens to the burn address (11111111111111111111111111111112) like your Solscan transaction
        </div>
      )}

      {status && (
        <div style={{ 
          marginTop: '0.5rem', 
          padding: '0.5rem',
          backgroundColor: 'white',
          borderRadius: '4px',
          fontSize: '0.9em',
          wordBreak: 'break-all',
          border: '1px solid #dc2626'
        }}>
          {status}
        </div>
      )}
    </div>
  );
}