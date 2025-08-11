import { useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { 
  Transaction, 
  SystemProgram,
  Keypair,
} from '@solana/web3.js';
import {
  createInitializeMintInstruction,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  getAssociatedTokenAddress,
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
  getMinimumBalanceForRentExemptMint,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';

interface Props {
  onTokenMinted?: (mintAddress: string, amount: number) => void;
  autoAddAsCreator?: boolean;
}

export default function DevMintButton({ onTokenMinted, autoAddAsCreator = true }: Props) {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [loading, setLoading] = useState(false);
  const [lastMint, setLastMint] = useState<string | null>(null);
  const [network, setNetwork] = useState<'devnet' | 'mainnet' | 'unknown'>('unknown');

  // Check network on mount
  useEffect(() => {
    const checkNetwork = async () => {
      try {
        const genesisHash = await connection.getGenesisHash();
        const DEVNET_GENESIS = 'EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG';
        setNetwork(genesisHash === DEVNET_GENESIS ? 'devnet' : 'mainnet');
      } catch (error) {
        console.error('Failed to check network:', error);
        setNetwork('unknown');
      }
    };
    checkNetwork();
  }, [connection]);

  const mintDevTokens = async () => {
    if (!publicKey) {
      alert('Please connect your wallet first');
      return;
    }

    // Safety check: Ensure we're on devnet
    try {
      const genesisHash = await connection.getGenesisHash();
      const DEVNET_GENESIS = 'EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG';
      
      if (genesisHash !== DEVNET_GENESIS) {
        alert('❌ SAFETY CHECK FAILED!\n\nYour wallet appears to be connected to MAINNET.\nPlease switch your wallet to DEVNET before minting test tokens.\n\nThis prevents accidental mainnet transactions that would cost real SOL.');
        return;
      }
    } catch (error) {
      console.error('Failed to verify network:', error);
      alert('⚠️ Unable to verify network. Please ensure you are connected to Solana DEVNET before proceeding.');
      return;
    }

    setLoading(true);
    try {
      // Generate a new mint keypair
      const mintKeypair = Keypair.generate();
      const mint = mintKeypair.publicKey;

      // Get associated token account address
      const associatedTokenAccount = await getAssociatedTokenAddress(
        mint,
        publicKey,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      // Get minimum balance for mint account
      const mintBalance = await getMinimumBalanceForRentExemptMint(connection);

      // Get recent blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      
      const transaction = new Transaction();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      // Create mint account
      transaction.add(
        SystemProgram.createAccount({
          fromPubkey: publicKey,
          newAccountPubkey: mint,
          space: MINT_SIZE,
          lamports: mintBalance,
          programId: TOKEN_PROGRAM_ID,
        })
      );

      // Initialize mint
      transaction.add(
        createInitializeMintInstruction(
          mint,
          6, // 6 decimals
          publicKey, // mint authority
          publicKey, // freeze authority
          TOKEN_PROGRAM_ID
        )
      );

      // Create associated token account
      transaction.add(
        createAssociatedTokenAccountInstruction(
          publicKey, // payer
          associatedTokenAccount, // associated token account
          publicKey, // owner
          mint, // mint
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        )
      );

      // Mint tokens to the associated account
      const mintAmount = 1000 * Math.pow(10, 6); // 1000 tokens with 6 decimals
      transaction.add(
        createMintToInstruction(
          mint, // mint
          associatedTokenAccount, // destination
          publicKey, // authority
          mintAmount, // amount
          [],
          TOKEN_PROGRAM_ID
        )
      );

      // Add the mint keypair as a signer
      transaction.partialSign(mintKeypair);

      // Send transaction
      const signature = await sendTransaction(transaction, connection);
      
      // Wait for confirmation
      await connection.confirmTransaction(signature);

      const mintAddress = mint.toBase58();
      setLastMint(mintAddress);
      
      console.log('✅ Token minted successfully!');
      console.log('Mint Address:', mintAddress);
      console.log('Transaction:', signature);
      
      onTokenMinted?.(mintAddress, 1000);
      
      // Auto-add as creator if enabled
      if (autoAddAsCreator) {
        try {
          const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3001';
          const response = await fetch(`${API_BASE}/creators`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              mint: mintAddress,
              name: `Test Token ${mintAddress.slice(-8)}`,
              decimals: 6,
              symbol: 'TEST',
            }),
          });

          if (response.ok) {
            console.log('✅ Auto-added as creator');
            alert(`Token minted and added as creator!\nMint: ${mintAddress}\nAmount: 1000 tokens`);
            // Refresh to show new creator
            setTimeout(() => window.location.reload(), 1500);
          } else {
            throw new Error('Failed to add as creator');
          }
        } catch (error) {
          console.error('Failed to auto-add creator:', error);
          alert(`Token minted successfully but failed to add as creator.\nMint: ${mintAddress}\nAmount: 1000 tokens\n\nYou can manually add it using the form below.`);
        }
      } else {
        alert(`Token minted successfully!\nMint: ${mintAddress}\nAmount: 1000 tokens`);
      }

    } catch (error) {
      console.error('Error minting tokens:', error);
      alert(`Error minting tokens: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const copyMintAddress = () => {
    if (lastMint) {
      navigator.clipboard.writeText(lastMint);
      alert('Mint address copied to clipboard!');
    }
  };

  return (
    <div style={{ 
      border: '2px solid #f59e0b', 
      padding: '1rem', 
      margin: '1rem 0',
      backgroundColor: '#fffbeb',
      borderRadius: '8px'
    }}>
      <h3>🚀 Dev Tools - Mint Test Tokens</h3>
      
      {/* Network indicator */}
      <div style={{ 
        marginBottom: '1rem', 
        padding: '0.5rem',
        backgroundColor: network === 'devnet' ? '#dcfce7' : network === 'mainnet' ? '#fee2e2' : '#f3f4f6',
        borderRadius: '4px',
        border: `1px solid ${network === 'devnet' ? '#16a34a' : network === 'mainnet' ? '#dc2626' : '#6b7280'}`
      }}>
        <strong>Network: </strong>
        <span style={{ 
          color: network === 'devnet' ? '#16a34a' : network === 'mainnet' ? '#dc2626' : '#6b7280',
          fontWeight: 'bold'
        }}>
          {network.toUpperCase()}
          {network === 'mainnet' && ' ⚠️ SWITCH TO DEVNET!'}
          {network === 'devnet' && ' ✅ SAFE FOR TESTING'}
        </span>
      </div>

      <p style={{ fontSize: '0.9em', color: '#92400e', marginBottom: '1rem' }}>
        This mints new tokens on devnet for testing burns. Each mint creates 1000 tokens.
      </p>
      
      <button
        onClick={mintDevTokens}
        disabled={loading || !publicKey || network === 'mainnet'}
        style={{
          backgroundColor: loading || network === 'mainnet' ? '#9ca3af' : '#f59e0b',
          color: 'white',
          border: 'none',
          padding: '0.5rem 1rem',
          borderRadius: '4px',
          cursor: loading || !publicKey || network === 'mainnet' ? 'not-allowed' : 'pointer',
          marginRight: '0.5rem'
        }}
      >
        {loading ? 'Minting...' : network === 'mainnet' ? '🚫 Switch to Devnet First' : 'Mint 1000 Test Tokens'}
      </button>

      {lastMint && (
        <div style={{ marginTop: '1rem' }}>
          <p style={{ fontSize: '0.9em', fontWeight: 'bold' }}>Last minted token:</p>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <code style={{ 
              fontSize: '0.8em', 
              backgroundColor: '#f3f4f6', 
              padding: '0.25rem 0.5rem',
              borderRadius: '4px',
              flex: 1
            }}>
              {lastMint}
            </code>
            <button
              onClick={copyMintAddress}
              style={{
                backgroundColor: '#059669',
                color: 'white',
                border: 'none',
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.8em'
              }}
            >
              Copy
            </button>
          </div>
        </div>
      )}

      {!publicKey && (
        <p style={{ color: '#dc2626', fontSize: '0.9em', marginTop: '0.5rem' }}>
          Please connect your wallet to mint tokens
        </p>
      )}
    </div>
  );
}