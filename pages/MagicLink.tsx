
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { db } from '../services/db';
import Logo from '../components/Logo';

export default function MagicLink() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError(null);

    try {
      const { error } = await db.auth.signInWithMagicLink(email);
      if (error) throw error;
      setIsSuccess(true);
    } catch (err: any) {
      console.error("Magic link request error:", err);
      setError(err.message || "Failed to send magic link. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center animate-fade-in">
          <div className="mx-auto flex items-center justify-center w-16 h-16 bg-green-50 rounded-full mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Check your inbox</h2>
          <p className="text-gray-600 mb-8">
            We've sent a magic login link to <span className="font-semibold text-gray-900">{email}</span>.
          </p>
          <Link to="/login">
            <Button className="w-full rounded-full" variant="outline">
              Back to Sign In
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="text-center">
          <Link to="/">
            <Logo className="h-8 mx-auto mb-6" />
          </Link>
          <h2 className="text-3xl font-extrabold text-gray-900">Sign in with Magic Link</h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your email and we'll send you a link to sign in instantly.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email address</Label>
              <div className="mt-1 relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  placeholder="name@example.com"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <Button
              type="submit"
              className="w-full rounded-full"
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {loading ? 'Sending link...' : 'Send Magic Link'}
            </Button>
            
            <Link to="/login" className="flex items-center justify-center text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Sign In
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}