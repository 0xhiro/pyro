import React from 'react';
import BannerOverlay from './components/BannerOverlay';

export default function Overlay() {
  const params = new URLSearchParams(window.location.search);
  // accept both for transition, prefer creatorMint
  const creatorMint = params.get('creatorMint') || params.get('creatorId') || '';

  if (!creatorMint) {
    return (
      <div style={{ color: '#fff', background: 'transparent', fontFamily: 'Inter, system-ui, sans-serif' }}>
        Missing <code>creatorMint</code> query param.
      </div>
    );
  }

  return (
    <div
      style={{
        background: 'transparent',
        width: '100vw',
        height: '100vh',
        display: 'grid',
        placeItems: 'center',
      }}
    >
      <BannerOverlay creatorId={creatorMint} /> {/** BannerOverlay still uses prop "creatorId" internally; fine for now */}
    </div>
  );
}
