import React from 'react';
import BannerOverlay from './components/BannerOverlay';

export default function Overlay() {
  const params = new URLSearchParams(window.location.search);
  const creatorId = params.get('creatorId') || '';

  if (!creatorId) {
    return (
      <div style={{ color: '#fff', background: 'transparent', fontFamily: 'Inter, system-ui, sans-serif' }}>
        Missing <code>creatorId</code> query param.
      </div>
    );
  }

  // Make page background transparent-friendly for OBS.
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
      <BannerOverlay creatorId={creatorId} />
    </div>
  );
}
