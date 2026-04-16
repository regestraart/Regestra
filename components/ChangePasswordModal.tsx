
import React, { useState, useEffect } from 'react';
import { X, Lock, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Label } from './ui/Label';
import { db } from '../services/db';

interface ChangePasswordModalProps {
  onClose: () => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ onClose }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const passwordsMatch = password && confirmPassword && password === confirmPassword;
  const passwordMismatch = password && confirmPassword && password !== confirmPassword;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordsMatch) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await db.auth.updateUser({ password });
      if (error) throw error;
      
      setIsSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (err: any) {
      console.error("Update password error:", err);
      setError(err.message || "Failed to update password. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 animate-slide-up" onClick={e => e.stopPropagation()}>
            {isSuccess ? (
                <div className="text-center">
                    <div className="mx-auto flex items-center justify-center w-16 h-16 bg-green-50 rounded-full mb-6">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Password Updated!</h2>
                    <p className="text-gray-600">Your password has been successfully changed.</p>
                </div>
            ) : (
                <>
                    <div className="flex items-start mb-6">
                        <div className="mr-4 flex-shrink-0 bg-purple-100 rounded-full p-3">
                            <Lock className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Change Password</h2>
                            <p className="text-gray-600 mt-1 text-sm">Enter a new secure password for your account.</p>
                        </div>
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <Label htmlFor="new-password" title="At least 6 characters">New Password</Label>
                                <Input 
                                    id="new-password" 
                                    type="password" 
                                    required 
                                    minLength={6} 
                                    value={password} 
                                    onChange={(e) => { setPassword(e.target.value); setError(null); }}
                                    className="rounded-xl" 
                                    placeholder="••••••••" 
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="confirm-new-password">Confirm New Password</Label>
                                <div className="relative">
                                    <Input 
                                        id="confirm-new-password" 
                                        type="password" 
                                        required 
                                        minLength={6} 
                                        value={confirmPassword} 
                                        onChange={(e) => { setConfirmPassword(e.target.value); setError(null); }}
                                        className={`rounded-xl pr-10 ${passwordMismatch ? 'border-red-300 focus:ring-red-500' : ''}`} 
                                        placeholder="••••••••" 
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        {passwordsMatch && <CheckCircle className="w-4 h-4 text-green-500" />}
                                        {passwordMismatch && <XCircle className="w-4 h-4 text-red-500" />}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex items-center gap-3 text-sm">
                                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                <p className="text-red-700 font-medium">{error}</p>
                            </div>
                        )}

                        <div className="mt-8 flex justify-end gap-3">
                            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                                Cancel
                            </Button>
                            <Button 
                                type="submit" 
                                disabled={loading || !passwordsMatch || password.length < 6}
                            >
                                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Updating...</> : 'Update Password'}
                            </Button>
                        </div>
                    </form>
                </>
            )}
        </div>
    </div>
  );
};

export default ChangePasswordModal;
