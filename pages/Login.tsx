
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { db } from '../services/db';
import { useUser } from '../context/UserContext';
import Logo from '../components/Logo';
import { AlertCircle } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { setCurrentUser } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const clearSession = async () => {
        try {
            await db.auth.signOut();
        } catch (e) {
            console.error("Error clearing session", e);
        }
    };
    clearSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
        setError("Please enter both email and password.");
        return;
    }
    
    setLoading(true);

    try {
      const { data, error: authError } = await db.auth.signInWithPassword(trimmedEmail, password);
      
      if (authError) {
        if (authError.message === 'Invalid login credentials') {
           throw new Error("Invalid email or password. Please try again or sign up for a new account.");
        }
        throw new Error(authError.message);
      }

      if (data.user) {
        const profile = await db.users.getFullProfile(data.user.id);
        
        if (!profile) {
            // This happens if the user was created in Auth but the Profile trigger failed
            throw new Error("Your account was created but your profile is missing. This usually means the database schema isn't fully set up. Please contact support or check the SQL repair script.");
        }
        
        setCurrentUser(profile);
        navigate('/'); 
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-3xl shadow-sm border border-gray-100">
        <div className="text-center">
            <Link to="/">
                <Logo className="h-8 mx-auto mb-6" />
            </Link>
          <h2 className="rg-auth-heading">
            Welcome back
          </h2>
          <p className="mt-2 rg-small" style={{color:"#6b7280"}}>
            Don't have an account?{' '}
            <Link to="/sign-up" className="font-bold text-purple-600 hover:text-purple-500 transition-colors">
              Sign up free
            </Link>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="email" className="rg-label" style={{color:"#6b7280",marginLeft:4}}>Email address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="rounded-xl h-12"
              />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between mb-1 px-1">
                <Label htmlFor="password" title="At least 6 characters" className="rg-label" style={{color:"#6b7280"}}>Password</Label>
                <Link to="/magic-link" className="text-xs font-bold text-purple-600 hover:text-purple-500 transition-colors">
                  Use Magic Link
                </Link>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="rounded-xl h-12"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-3 animate-slide-up">
              <div className="flex-shrink-0 text-red-500 mt-0.5">
                <AlertCircle className="w-5 h-5" />
              </div>
              <p className="text-sm text-red-700 font-medium leading-relaxed">
                {error}
              </p>
            </div>
          )}

          <div className="pt-2">
            <Button
              type="submit"
              className="w-full rounded-2xl h-14 text-lg font-bold shadow-xl bg-gradient-to-r from-purple-600 to-blue-500 hover:opacity-90 transition-transform active:scale-[0.98]"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </div>
          
          <div className="text-center">
             <p className="text-xs text-gray-400 font-medium uppercase tracking-widest mt-4">
                 Regestra Network
             </p>
          </div>
        </form>
      </div>
    </div>
  );
}