import React from 'react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className }) => {
  return (
    <span
      className={className}
      style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontWeight: 800,
        fontSize: '1.35rem',
        letterSpacing: '-0.03em',
        background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 60%, #0d9488 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        lineHeight: 1,
        display: 'inline-block',
        userSelect: 'none',
      }}
    >
      regestra
    </span>
  );
};

export default Logo;