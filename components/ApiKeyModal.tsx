
import React, { useEffect } from 'react';
import { X, ExternalLink, AlertTriangle } from 'lucide-react';
import { Button } from './ui/Button';

interface ApiKeyModalProps {
  onClose: () => void;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onClose }) => {
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

  return (
    <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-start">
            <div className="mr-4 flex-shrink-0 bg-amber-100 rounded-full p-3">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <div>
                <h2 className="text-xl font-bold text-gray-900">AI Quota Limit Reached</h2>
                <p className="text-gray-600 mt-2">
                  This feature is currently unavailable due to high demand or an issue with the application's API key.
                </p>
                 <p className="text-gray-600 mt-2">
                  If you are the administrator, please check your API key's quota and billing status in your Google Cloud Console and verify the <code>GEMINI_API_KEY</code> in your deployment settings.
                </p>
            </div>
        </div>
        <div className="mt-6 text-center text-xs text-gray-500">
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-purple-600 underline">
                Learn more about quotas & billing <ExternalLink className="w-3 h-3" />
            </a>
        </div>
        <div className="mt-8 flex justify-end">
          <Button type="button" onClick={onClose} className="w-full sm:w-auto">
            OK
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;
