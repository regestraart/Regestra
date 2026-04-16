import React from 'react';

interface VerifiedArtistBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const VerifiedArtistBadge: React.FC<VerifiedArtistBadgeProps> = ({
  size = 'md',
  showLabel = false,
}) => {
  const dims = { sm: 14, md: 18, lg: 22 };
  const d = dims[size];

  const badge = (
    <svg
      width={d} height={d}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}
    >
      <defs>
        <linearGradient id="vab-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#0d9488" />
        </linearGradient>
      </defs>
      {/* Shield shape */}
      <path
        d="M12 2L3 6v6c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V6L12 2z"
        fill="url(#vab-grad)"
      />
      {/* Checkmark */}
      <path
        d="M9 12l2 2 4-4"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  if (!showLabel) return badge;

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      {badge}
      <span style={{
        fontSize: size === 'sm' ? '0.65rem' : size === 'lg' ? '0.82rem' : '0.72rem',
        fontWeight: 700,
        background: 'linear-gradient(135deg, #7c3aed, #0d9488)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        letterSpacing: '0.02em',
      }}>
        Verified Artist
      </span>
    </div>
  );
};

export default VerifiedArtistBadge;
