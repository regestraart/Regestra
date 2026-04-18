import React, { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';

interface ImageLightboxProps {
  src: string;
  alt?: string;
  onClose: () => void;
}

export default function ImageLightbox({ src, alt, onClose }: ImageLightboxProps) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.92)',
        display: 'flex', flexDirection: 'column',
        animation: 'lb-fade-in 0.18s ease',
      }}
      onClick={onClose}
    >
      <style>{`
        @keyframes lb-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes lb-img-in {
          from { opacity: 0; transform: scale(0.94); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>

      {/* Close button — top right only */}
      <div
        style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 16px', flexShrink: 0 }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          title="Close"
          style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'rgba(255,255,255,0.85)',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.4)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)'; }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Image */}
      <div
        style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '8px 16px', overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        <img
          src={src}
          alt={alt || 'Artwork'}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            borderRadius: 12,
            animation: 'lb-img-in 0.22s ease',
            boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
          }}
          draggable={false}
        />
      </div>

      {/* Bottom hint */}
      <div
        style={{
          textAlign: 'center', padding: '10px 16px 14px',
          fontSize: '11px', color: 'rgba(255,255,255,0.3)',
          fontWeight: 600, letterSpacing: '0.06em', flexShrink: 0,
        }}
        onClick={e => e.stopPropagation()}
      >
        ESC to close
      </div>
    </div>
  );
}
