import React, { useState, useEffect, useRef } from 'react';
import { X, Trash2, Camera, Loader2, Upload, AlertCircle } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Label } from './ui/Label';
import { Textarea } from './ui/Textarea';
import { User } from '../data/mock';
import ConfirmationModal from './ConfirmationModal';
import { db } from '../services/db';

interface EditProfileModalProps {
  user: User;
  onClose: () => void;
  onSave: (updates: Partial<User>) => Promise<void>;
  onDelete?: () => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ user, onClose, onSave, onDelete }) => {
  const [formData, setFormData] = useState({
    name: user.name || '',
    username: user.username || '',
    bio: user.bio || '',
    location: user.location || '',
    website: user.website || '',
    avatar: user.avatar || '',
    coverImage: user.coverImage || '',
    commissionStatus: user.commissionStatus || 'Not Available'
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !showDeleteConfirm && !isSaving) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'auto';
    };
  }, [onClose, showDeleteConfirm, isSaving]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'coverImage') => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          setUploadError(null);
          try {
              if (type === 'avatar') setUploadingAvatar(true);
              else setUploadingCover(true);

              const bucket = type === 'avatar' ? 'avatars' : 'artworks';
              
              // Fixed: Removed resizeOptions as db.storage.uploadImage expects only 2 arguments (bucket, file)
              const publicUrl = await db.storage.uploadImage(bucket, file);
              setFormData(prev => ({ ...prev, [type]: publicUrl }));
          } catch (error: any) {
              console.error(`Failed to upload ${type}`, error);
              setUploadError(error?.message || String(error) || `Failed to upload ${type === 'avatar' ? 'profile picture' : 'cover image'}.`);
          } finally {
              if (type === 'avatar') setUploadingAvatar(false);
              else setUploadingCover(false);
          }
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setIsSaving(true);
    try {
        await onSave(formData as Partial<User>);
    } catch (err: any) {
        console.error("Save failed detail:", err);
        
        let message = "An unknown error occurred.";
        
        if (typeof err === 'string') {
            message = err;
        } else if (err instanceof Error) {
            message = err.message;
        } else if (err?.message) {
            message = err.message;
        } else {
            try {
                message = JSON.stringify(err);
            } catch {
                message = "Database configuration error.";
            }
        }
        
        if (message.includes("column") || message.includes("schema cache")) {
            message = "Your database is missing a column. Please run the SQL script in the chat to add the 'commission_status' field.";
        } else if (message.includes("profiles_username_key")) {
            message = "This username is already taken. Please choose another one.";
        }

        setSaveError(message);
    } finally {
        setIsSaving(false);
    }
  };

  const handleDeleteClick = () => {
      setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
      if (onDelete) onDelete();
      setShowDeleteConfirm(false); 
  };

  return (
    <>
    <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={() => !isSaving && onClose()}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Edit Profile</h2>
          <Button variant="ghost" size="icon" onClick={onClose} disabled={isSaving} className="rounded-full" aria-label="Close modal">
            <X className="w-5 h-5 text-gray-500" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-0 flex flex-col flex-1">
          <div className="relative mb-12">
            <div className="h-32 bg-gray-100 w-full relative group">
                {formData.coverImage ? (
                    <img src={formData.coverImage} alt="Cover" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">
                        <span className="text-sm">No Cover Image</span>
                    </div>
                )}
                
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button 
                        type="button" 
                        variant="outline-light" 
                        size="sm" 
                        onClick={() => coverInputRef.current?.click()}
                        disabled={uploadingCover || isSaving}
                        className="rounded-full"
                    >
                        {uploadingCover ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Camera className="w-4 h-4 mr-2" /> Change Cover</>}
                    </Button>
                </div>
                <input 
                    type="file" 
                    ref={coverInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={(e) => handleFileChange(e, 'coverImage')} 
                />
            </div>

            <div className="absolute -bottom-10 left-6">
                <div className="relative group w-24 h-24">
                    <div className="w-full h-full rounded-full border-4 border-white bg-white overflow-hidden shadow-md">
                        <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover bg-gray-200" />
                    </div>
                    
                    <div 
                        className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border-4 border-transparent"
                        onClick={() => !isSaving && avatarInputRef.current?.click()}
                    >
                         {uploadingAvatar ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <Camera className="w-6 h-6 text-white" />}
                    </div>
                    <input 
                        type="file" 
                        ref={avatarInputRef} 
                        className="hidden" 
                        accept="image/*" 
                        onChange={(e) => handleFileChange(e, 'avatar')} 
                    />
                </div>
            </div>
          </div>

          <div className="px-6 pb-6 space-y-4">
            {uploadError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {uploadError}
                </div>
            )}
             {saveError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-sm text-red-700 break-words">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-1" />
                    <p className="flex-1">{saveError}</p>
                </div>
            )}

            <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleChange} required disabled={isSaving} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" name="username" value={formData.username} onChange={handleChange} required disabled={isSaving} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea id="bio" name="bio" value={formData.bio} onChange={handleChange} rows={3} disabled={isSaving} />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" name="location" value={formData.location} onChange={handleChange} placeholder="City, Country" disabled={isSaving} />
                </div>
                <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input id="website" name="website" value={formData.website} onChange={handleChange} placeholder="your-site.com" disabled={isSaving} />
                </div>
            </div>

            {user.role === 'artist' && (
                <div className="space-y-2">
                    <Label htmlFor="commissionStatus">Commission Status</Label>
                    <div className="relative">
                        <select
                            id="commissionStatus"
                            name="commissionStatus"
                            value={formData.commissionStatus}
                            onChange={(e) => setFormData(prev => ({ ...prev, commissionStatus: e.target.value as any }))}
                            disabled={isSaving}
                            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
                        >
                            <option value="Open">Open for Commissions</option>
                            <option value="Closed">Closed</option>
                            <option value="Not Available">Not Available</option>
                        </select>
                    </div>
                </div>
            )}
            
            <div className="pt-6 flex items-center justify-between border-t border-gray-100 mt-4">
                {onDelete && (
                    <Button type="button" variant="ghost" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={handleDeleteClick} disabled={isSaving}>
                        <Trash2 className="w-4 h-4 mr-2" /> Delete Account
                    </Button>
                )}
                <div className="flex gap-3 ml-auto">
                    <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>Cancel</Button>
                    <Button type="submit" disabled={isSaving}>
                        {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : 'Save Changes'}
                    </Button>
                </div>
            </div>
          </div>
        </form>
      </div>
    </div>
    
    {showDeleteConfirm && (
        <ConfirmationModal
            title="Delete Account"
            description="Are you sure you want to delete your account? This action cannot be undone. All your data will be permanently removed."
            confirmText="Delete Account"
            onClose={() => setShowDeleteConfirm(false)}
            onConfirm={handleConfirmDelete}
        />
    )}
    </>
  );
};

export default EditProfileModal;