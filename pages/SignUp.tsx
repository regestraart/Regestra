
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Mail, Lock, Palette, Heart } from 'lucide-react';

export default function SignUp() {
  const navigate = useNavigate();
  const [role, setRole] = useState<'artist' | 'artLover' | null>(null);

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (role) {
      navigate(createPageUrl('EmailVerification'));
    }
  };

  const roleButtonClasses = (selectedRole: 'artist' | 'artLover') => 
    `flex flex-col items-center justify-center p-6 border-2 rounded-2xl cursor-pointer transition-all duration-200 text-center
    ${role === selectedRole 
      ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200' 
      : 'border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300'}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_691b6257d4173f2ed6ec3e95/7495ad18b_RegestraLogo.png" 
            alt="Regestra" 
            className="h-10 mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold text-gray-900">Create your Account</h1>
          <p className="text-gray-600 mt-2">Join our community of artists and art enthusiasts.</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
          <form onSubmit={handleSignUp} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input id="email" type="email" placeholder="you@example.com" required className="pl-10 h-12 rounded-xl" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input id="password" type="password" required className="pl-10 h-12 rounded-xl" placeholder="••••••••" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>I am an...</Label>
              <div className="grid grid-cols-2 gap-4">
                <button type="button" onClick={() => setRole('artist')} className={roleButtonClasses('artist')}>
                  <Palette className="w-8 h-8 mb-2 text-purple-600" />
                  <span className="font-semibold text-gray-800">Artist</span>
                </button>
                <button type="button" onClick={() => setRole('artLover')} className={roleButtonClasses('artLover')}>
                  <Heart className="w-8 h-8 mb-2 text-pink-500" />
                  <span className="font-semibold text-gray-800">Art Lover</span>
                </button>
              </div>
            </div>
            
            <Button type="submit" disabled={!role} className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
              Create Account
            </Button>
          </form>
        </div>
        
        <p className="text-center text-sm text-gray-600 mt-8">
          Already have an account?{' '}
          <Link to={createPageUrl('Login')} className="text-purple-600 hover:underline font-medium">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
}