
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Mail, Lock } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(createPageUrl('HomeSocial'));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_691b6257d4173f2ed6ec3e95/7495ad18b_RegestraLogo.png" 
            alt="Regestra" 
            className="h-10 mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
          <p className="text-gray-600 mt-2">Log in to continue to Regestra.</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input id="email" type="email" placeholder="you@example.com" required className="pl-10 h-12 rounded-xl" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <a href="#" className="text-sm text-purple-600 hover:underline">Forgot password?</a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input id="password" type="password" required className="pl-10 h-12 rounded-xl" placeholder="••••••••" />
              </div>
            </div>
            
            <Button type="submit" className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white rounded-xl font-semibold">
              Log In
            </Button>
          </form>
        </div>
        
        <p className="text-center text-sm text-gray-600 mt-8">
          Don't have an account?{' '}
          <Link to={createPageUrl('SignUp')} className="text-purple-600 hover:underline font-medium">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}