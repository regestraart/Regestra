
import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Twitter, Facebook, Linkedin, Mail } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

interface ShareModalProps {
  onClose: () => void;
  url: string;
  title: string;
}

const ShareModal: React.FC<ShareModalProps> = ({ onClose, url, title }) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'auto';
    };
  }, [onClose]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const shareLinks = [
    {
      name: 'Twitter',
      icon: Twitter,
      color: 'bg-sky-500 text-white hover:bg-sky-600',
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`
    },
    {
      name: 'Facebook',
      icon: Facebook,
      color: 'bg-blue-600 text-white hover:bg-blue-700',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      color: 'bg-blue-700 text-white hover:bg-blue-800',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
    },
    {
      name: 'Email',
      icon: Mail,
      color: 'bg-gray-600 text-white hover:bg-gray-700',
      href: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`Check out this profile: ${url}`)}`
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Share Profile</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full" aria-label="Close modal">
            <X className="w-5 h-5 text-gray-500" />
          </Button>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-8">
          {shareLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 group"
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 ${link.color}`}>
                <link.icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-gray-600">{link.name}</span>
            </a>
          ))}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Page Link</label>
          <div className="flex gap-2">
            <Input 
              readOnly 
              value={url} 
              className="bg-gray-50 text-gray-600 border-gray-200"
            />
            <Button onClick={handleCopy} className={`min-w-[100px] ${copied ? 'bg-green-600 hover:bg-green-700' : ''}`}>
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" /> Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" /> Copy
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
