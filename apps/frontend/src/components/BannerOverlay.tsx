import React from 'react';
import { useLeaderboard } from '../hooks/useLeaderboard';

function short(addr: string, n = 4) {
  if (!addr) return '';
  return addr.length <= n * 2 ? addr : `${addr.slice(0, n)}…${addr.slice(-n)}`;
}

type Props = { creatorId: string };

export default function BannerOverlay({ creatorId }: Props) {
  const { entries, loading, error } = useLeaderboard(creatorId, { limit: 3, intervalMs: 5000 });
  const top = entries[0];

  // Transparent, dark banner friendly to OBS/Restream overlays.
  return (
    <div
      style={{
        fontFamily: 'Inter, system-ui, sans-serif',
        color: '#E5E7EB',
        background: 'rgba(17, 24, 39, 0.75)', // #111827 @ 75%
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12,
        padding: '10px 14px',
        minWidth: 320,
        maxWidth: 560,
        boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
      }}
    >
      <div style={{ fontSize: 12, letterSpacing: 0.4, textTransform: 'uppercase', opacity: 0.8 }}>
        Top burner
      </div>

      {loading ? (
        <div style={{ fontSize: 14, marginTop: 4 }}>Loading…</div>
      ) : error ? (
        <div style={{ fontSize: 14, marginTop: 4, color: '#FCA5A5' }}>Error: {error}</div>
      ) : top ? (
        <div style={{ marginTop: 4 }}>
          <div style={{ fontSize: 18, fontWeight: 600 }}>{short(top.wallet, 5)}</div>
          <div style={{ fontSize: 14, opacity: 0.9 }}>
            Total burned: <span style={{ fontWeight: 600 }}>{top.totalBurned}</span>
          </div>
        </div>
      ) : (
        <div style={{ fontSize: 14, marginTop: 4 }}>No burns yet — be the first.</div>
      )}

      {entries.length > 1 && (
        <div
          style={{
            marginTop: 8,
            fontSize: 12,
            borderTop: '1px solid rgba(255,255,255,0.08)',
            paddingTop: 6,
            display: 'flex',
            gap: 12,
            whiteSpace: 'nowrap',
          }}
        >
          {entries.map((e, i) => (
            <div key={e.wallet} style={{ opacity: i === 0 ? 1 : 0.9 }}>
              #{(e.rank ?? i + 1)} {short(e.wallet)} · {e.totalBurned}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
