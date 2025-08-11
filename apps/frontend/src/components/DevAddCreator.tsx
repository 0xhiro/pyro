import React, { useState } from 'react';

interface Props {
  onCreatorAdded?: (creatorMint: string) => void;
}

export default function DevAddCreator({ onCreatorAdded }: Props) {
  const [mintAddress, setMintAddress] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const addCreator = async () => {
    if (!mintAddress.trim() || !name.trim()) {
      alert('Please enter both mint address and name');
      return;
    }

    setLoading(true);
    try {
      const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3001';
      
      const response = await fetch(`${API_BASE}/creators`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mint: mintAddress.trim(),
          name: name.trim(),
          decimals: 6, // Default for SPL tokens
          symbol: name.trim().toUpperCase().slice(0, 4), // Simple symbol
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add creator');
      }

      const creator = await response.json();
      console.log('✅ Creator added:', creator);
      
      onCreatorAdded?.(mintAddress.trim());
      
      // Clear form
      setMintAddress('');
      setName('');
      
      alert(`Creator "${name}" added successfully!`);

    } catch (error) {
      console.error('Error adding creator:', error);
      alert(`Error adding creator: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      border: '2px solid #10b981', 
      padding: '1rem', 
      margin: '1rem 0',
      backgroundColor: '#ecfdf5',
      borderRadius: '8px'
    }}>
      <h3> Dev Tools - Add Test Creator</h3>
      <p style={{ fontSize: '0.9em', color: '#047857', marginBottom: '1rem' }}>
        Add a newly minted token as a creator for testing burns and leaderboards.
      </p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="Token Mint Address"
          value={mintAddress}
          onChange={(e) => setMintAddress(e.target.value)}
          style={{
            padding: '0.5rem',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '0.9em'
          }}
        />
        <input
          type="text"
          placeholder="Creator Name (e.g., Test Creator)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{
            padding: '0.5rem',
            border: '1px solid #d1d5db',
            borderRadius: '4px'
          }}
        />
      </div>

      <button
        onClick={addCreator}
        disabled={loading || !mintAddress.trim() || !name.trim()}
        style={{
          backgroundColor: loading ? '#9ca3af' : '#10b981',
          color: 'white',
          border: 'none',
          padding: '0.5rem 1rem',
          borderRadius: '4px',
          cursor: loading || !mintAddress.trim() || !name.trim() ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Adding Creator...' : 'Add Creator'}
      </button>
    </div>
  );
}