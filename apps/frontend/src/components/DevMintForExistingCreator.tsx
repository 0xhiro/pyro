import { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { 
  Transaction, 
  SystemProgram,
  Keypair,
  PublicKey,
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
  getMint,
  TokenAccountNotFoundError,
} from '@solana/spl-token';

interface Props {
  creatorMint: string;
  onTokensCreated?: () => void;
}

export default function DevMintForExistingCreator({ creatorMint, onTokensCreated }: Props) {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('');

  const createAndMintTokens = async () => {
    if (!publicKey) {
      setStatus('❌ Please connect your wallet first');
      return;
    }

    setLoading(true);
    setStatus('🔍 Checking if token exists on blockchain...');

    try {
      const mintPk = new PublicKey(creatorMint);
      
      // Check if mint already exists
      try {
        await getMint(connection, mintPk);
        setStatus('✅ Token already exists on blockchain! You can use it for burning.');
        setLoading(false);
        return;
      } catch (error) {
        if (!(error instanceof TokenAccountNotFoundError)) {
          throw error; // Re-throw if it's not the expected error
        }
        // Mint doesn't exist, we need to create it
        setStatus('🚀 Token not found on blockchain. Creating it now...');
      }

      // Recreate the exact same mint using the existing mint address
      // This requires using the mint address as a Keypair
      const mintBytes = mintPk.toBytes();
      const mintKeypair = Keypair.fromSecretKey(mintBytes);
      
      // Verify the keypair matches the expected address
      if (mintKeypair.publicKey.toBase58() !== creatorMint) {
        setStatus('❌ Cannot create token: the mint address format is incompatible with keypair creation');
        setLoading(false);
        return;
      }

      // Get associated token account address
      const associatedTokenAccount = await getAssociatedTokenAddress(
        mintPk,
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

      setStatus('📝 Creating mint account...');

      // Create mint account
      transaction.add(
        SystemProgram.createAccount({
          fromPubkey: publicKey,
          newAccountPubkey: mintPk,
          space: MINT_SIZE,
          lamports: mintBalance,
          programId: TOKEN_PROGRAM_ID,
        })
      );

      // Initialize mint
      transaction.add(
        createInitializeMintInstruction(
          mintPk,
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
          mintPk, // mint
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        )
      );

      // Mint tokens to the associated account
      const mintAmount = 1000 * Math.pow(10, 6); // 1000 tokens with 6 decimals
      transaction.add(
        createMintToInstruction(
          mintPk, // mint
          associatedTokenAccount, // destination
          publicKey, // authority
          mintAmount, // amount
          [],
          TOKEN_PROGRAM_ID
        )
      );

      // Add the mint keypair as a signer
      transaction.partialSign(mintKeypair);

      setStatus('📡 Sending transaction...');
      
      // Send transaction
      const signature = await sendTransaction(transaction, connection);
      
      setStatus('⏳ Confirming transaction...');
      
      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed');

      setStatus(`✅ Success! Created token and minted 1000 tokens to your wallet. TX: ${signature.slice(0, 8)}...${signature.slice(-8)}`);
      
      console.log('✅ Token created and minted successfully!');
      console.log('Mint Address:', creatorMint);
      console.log('Transaction:', signature);
      
      onTokensCreated?.();

    } catch (error) {
      console.error('Error creating tokens:', error);
      if (error instanceof Error && error.message.includes('invalid public key input')) {
        setStatus('❌ Cannot create this token: the mint address cannot be converted to a valid keypair. Use "Mint Test Tokens" to create a new token instead.');
      } else {
        setStatus(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      border: '2px solid #8b5cf6',
      backgroundColor: '#faf5ff',
      padding: '1rem',
      borderRadius: '8px',
      marginBottom: '1rem'
    }}>
      <h4>🪙 Create Blockchain Token for This Creator</h4>
      <p style={{ fontSize: '0.9em', marginBottom: '1rem', color: '#7c3aed' }}>
        This creator exists in database but not on blockchain. Create it to enable burning.
      </p>
      
      <div style={{ 
        fontFamily: 'monospace', 
        fontSize: '0.8em', 
        backgroundColor: 'white', 
        padding: '0.5rem',
        borderRadius: '4px',
        marginBottom: '1rem',
        border: '1px solid #c4b5fd',
        wordBreak: 'break-all'
      }}>
        {creatorMint}
      </div>

      <button
        onClick={createAndMintTokens}
        disabled={loading || !publicKey}
        style={{
          backgroundColor: loading ? '#9ca3af' : '#8b5cf6',
          color: 'white',
          border: 'none',
          padding: '0.5rem 1rem',
          borderRadius: '4px',
          cursor: loading || !publicKey ? 'not-allowed' : 'pointer',
          fontWeight: 'bold'
        }}
      >
        {loading ? 'Creating...' : '🪙 Create Token & Mint 1000'}
      </button>

      {!publicKey && (
        <p style={{ color: '#dc2626', fontSize: '0.9em', marginTop: '0.5rem' }}>
          Please connect your wallet to create tokens
        </p>
      )}

      {status && (
        <div style={{ 
          marginTop: '0.5rem', 
          padding: '0.5rem',
          backgroundColor: 'white',
          borderRadius: '4px',
          fontSize: '0.9em',
          wordBreak: 'break-all',
          border: '1px solid #8b5cf6'
        }}>
          {status}
        </div>
      )}
    </div>
  );
}