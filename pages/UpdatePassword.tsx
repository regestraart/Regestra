import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Loader2, CheckCircle, AlertTriangle, XCircle, RefreshCw, ArrowLeft, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { db } from '../services/db';
import { supabase } from '../lib/supabase';
import Logo from '../components/Logo';

export default function UpdatePassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const passwordsMatch = password && confirmPassword && password === confirmPassword;
  const passwordMismatch = password && confirmPassword && password !== confirmPassword;

  useEffect(() => {
    let mounted = true;
    
    const verifyAccess = async () => {
        // Ensure we actually have an active session to perform the update
        const { data: { session } } = await supabase.auth.getSession();
        
        if (mounted) {
            if (session) {
                setHasSession(true);
            } else {
                console.warn("UpdatePassword: No active session found.");
                setHasSession(false);
            }
            setCheckingSession(false);
        }
    };

    verifyAccess();

    return () => { mounted = false; };
  }, []);

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No active session');
      
      const response = await fetch('/.netlify/functions/delete-account', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to delete account');
      
      await supabase.auth.signOut();
      window.location.replace('/');
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete account. Please try again.');
      setDeleteLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordsMatch) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await db.auth.updateUser({ password });
      if (error) throw error;
      
      setIsSuccess(true);
      // Wait a moment then log out to clear the temporary recovery session
      setTimeout(async () => {
          await db.auth.signOut();
      }, 1000);
    } catch (err: any) {
      console.error("Update password error:", err);
      setError(err.message || "Failed to update password. Your session may have expired.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-6 p-4 text-center">
        <div className="relative">
            <div className="w-16 h-16 rounded-3xl bg-purple-100 flex items-center justify-center animate-pulse">
                 <Lock className="w-8 h-8 text-purple-600" />
            </div>
            <div className="absolute -top-1 -right-1">
                 <div className="w-4 h-4 bg-purple-600 rounded-full animate-ping"></div>
            </div>
        </div>
        <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Accessing Secure Vault</h2>
            <p className="text-sm text-gray-500 mt-2 font-medium">Preparing your password update environment...</p>
        </div>
      </div>
    );
  }

  if (!hasSession && !isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-md w-full bg-white p-10 rounded-3xl shadow-xl border border-gray-100 text-center animate-slide-up">
          <div className="mx-auto flex items-center justify-center w-20 h-20 bg-red-50 rounded-full mb-6">
            <AlertTriangle className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">Access Denied</h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            We couldn't verify your security token. This usually happens if the link has already been used or has expired for security reasons.
          </p>
          <div className="space-y-4">
            <Link to="/forgot-password">
                <Button className="w-full rounded-2xl h-14 text-lg font-bold shadow-lg">
                  <RefreshCw className="w-5 h-5 mr-2" /> Request New Link
                </Button>
            </Link>
            <Link to="/login" className="flex items-center justify-center text-sm font-bold text-gray-400 hover:text-purple-600 transition-colors uppercase tracking-widest">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-md w-full bg-white p-10 rounded-3xl shadow-xl border border-gray-100 text-center animate-fade-in">
          <div className="mx-auto flex items-center justify-center w-20 h-20 bg-green-50 rounded-full mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">Success!</h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Your password has been updated. You can now log in with your new credentials.
          </p>
          <Link to="/login">
            <Button className="w-full rounded-2xl h-14 text-lg font-bold shadow-lg">
              Return to Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-3xl shadow-xl border border-gray-100">
        <div className="text-center">
          <Link to="/">
            <Logo className="h-8 mx-auto mb-6" />
          </Link>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Secure Update</h2>
          <p className="mt-2 text-sm text-gray-500 font-medium">
            Please enter your new secure password below.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="password" title="At least 6 characters" className="text-gray-700 font-bold ml-1">New Password</Label>
              <Input 
                id="password" 
                type="password" 
                required 
                minLength={6} 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="rounded-xl h-12" 
                placeholder="••••••••" 
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="confirmPassword" className="text-gray-700 font-bold ml-1">Confirm Password</Label>
              <div className="relative">
                <Input 
                    id="confirmPassword" 
                    type="password" 
                    required 
                    minLength={6} 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    className={`rounded-xl h-12 pr-10 ${passwordMismatch ? 'border-red-300 focus:ring-red-500' : ''}`} 
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
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-3 animate-slide-up">
                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                <p className="text-sm text-red-700 font-medium leading-relaxed">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full rounded-2xl h-14 text-lg font-bold shadow-xl bg-gradient-to-r from-purple-600 to-blue-500 hover:opacity-90 transition-transform active:scale-[0.98]"
            disabled={loading || !passwordsMatch || password.length < 6}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <RefreshCw className="w-5 h-5 mr-2" />}
            {loading ? 'Updating...' : 'Update Password'}
          </Button>
        </form>

        {/* Delete Account Section */}
        <div className="mt-8 pt-8 border-t border-gray-100">
          {!showDeleteConfirm ? (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-sm font-bold text-red-500 border border-red-100 bg-red-50 hover:bg-red-100 hover:border-red-200 transition-all"
            >
              <Trash2 className="w-4 h-4" /> Delete My Account
            </button>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 space-y-4 animate-slide-up">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-red-700">This action is permanent and cannot be undone.</p>
                  <p className="text-xs text-red-600 mt-1">Your profile, artworks, certificates, and all data will be permanently deleted.</p>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-red-700 uppercase tracking-wider">
                  Type DELETE to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                  placeholder="DELETE"
                  className="w-full px-4 py-3 rounded-xl border-2 border-red-200 bg-white text-sm font-mono font-bold text-red-700 focus:outline-none focus:border-red-400"
                />
              </div>
              {deleteError && (
                <p className="text-xs text-red-600 font-medium">{deleteError}</p>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); setDeleteError(null); }}
                  className="flex-1 py-3 rounded-xl text-sm font-bold text-gray-600 border border-gray-200 bg-white hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== 'DELETE' || deleteLoading}
                  className="flex-1 py-3 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  {deleteLoading ? 'Deleting...' : 'Delete Account'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}