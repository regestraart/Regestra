
import React, { useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { Button } from './ui/Button';

interface ConfirmationModalProps {
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ onClose, onConfirm, title, description, confirmText = "Confirm" }) => {
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
            <div className="mr-4 flex-shrink-0 bg-red-100 rounded-full p-3">
                <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
                <h2 className="text-xl font-bold text-gray-900">{title}</h2>
                <p className="text-gray-600 mt-2">{description}</p>
            </div>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm}>
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
