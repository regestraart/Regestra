
import React, { useEffect, useState } from 'react';
import { X, Image as ImageIcon, Sparkles, LoaderCircle, AlertTriangle } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Label } from './ui/Label';
import { useImageEnhancer } from '../hooks/useImageEnhancer';
import { CollectionArtwork } from '../data/mock';

interface AddToCollectionModalProps {
  onClose: () => void;
  onAddArtwork: (artwork: CollectionArtwork) => void;
}

const AddToCollectionModal: React.FC<AddToCollectionModalProps> = ({ onClose, onAddArtwork }) => {
  const [title, setTitle] = useState('');
  const [artistName, setArtistName] = useState('');
  const { isEnhancing, enhancementError, enhancedImage, enhanceImage, resetEnhancement } = useImageEnhancer();
  
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (typeof event.target?.result === 'string') {
          enhanceImage(event.target.result);
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (enhancedImage && title && artistName) {
      const newArtwork: CollectionArtwork = {
        id: `c${Date.now()}`,
        image: enhancedImage,
        title,
        artistName,
      };
      onAddArtwork(newArtwork);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Add to Collection</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full" aria-label="Close modal">
            <X className="w-5 h-5 text-gray-500" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">Artwork Image</Label>
            {enhancedImage ? (
                <div className="relative rounded-lg overflow-hidden bg-gray-100">
                    <div className="absolute top-2 left-2 bg-black/60 text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1 backdrop-blur-sm z-10"><Sparkles className="w-3 h-3" /> AI Enhanced</div>
                    <img src={enhancedImage} alt="Uploaded artwork" className="w-full h-64 object-cover" />
                    <button type="button" onClick={resetEnhancement} className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100" aria-label="Remove image"><X className="w-4 h-4 text-gray-700" /></button>
                </div>
            ) : (
                <div className={`relative border-2 border-dashed rounded-lg p-8 text-center flex items-center justify-center min-h-[150px] ${enhancementError ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}>
                    <input type="file" id="collection-upload" accept="image/*" onChange={handleFileChange} className="hidden" />
                    {isEnhancing ? (
                        <div>
                            <LoaderCircle className="w-10 h-10 mx-auto text-purple-600 animate-spin" />
                            <h3 className="text-lg font-semibold text-gray-900 mt-2">Enhancing...</h3>
                        </div>
                    ) : enhancementError ? (
                         <div className="text-red-700">
                            <AlertTriangle className="w-10 h-10 mx-auto text-red-500" />
                            <p className="text-sm my-2">{enhancementError}</p>
                            <Button type="button" variant="outline" size="sm" onClick={() => { resetEnhancement(); document.getElementById('collection-upload')?.click(); }} className="rounded-full">Try Again</Button>
                        </div>
                    ) : (
                        <label htmlFor="collection-upload" className="cursor-pointer">
                            <ImageIcon className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                            <p className="text-sm text-gray-600">Click to upload an image</p>
                        </label>
                    )}
                </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="artwork-title">Title *</Label>
            <Input id="artwork-title" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g., Starry Night" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="artist-name">Artist's Name *</Label>
            <Input id="artist-name" value={artistName} onChange={(e) => setArtistName(e.target.value)} required placeholder="e.g., Vincent van Gogh" />
          </div>
        
          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={!enhancedImage || !title || !artistName}>Add to Collection</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddToCollectionModal;
