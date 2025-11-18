
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Mail, Lock, Palette, Heart, User as UserIcon, ArrowLeft, LoaderCircle } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { users } from '../data/mock';

type Role = 'artist' | 'artLover';

export default function SignUp() {
  const navigate = useNavigate();
  const { setCurrentUser } = useUser();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<Role | null>(null);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (role) {
      setStep(2);
    }
  };
  
  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (role) {
      setIsSigningUp(true);
      // Simulate API call
      setTimeout(() => {
        setCurrentUser(users[role]);
        navigate(createPageUrl('HomeSocial'));
      }, 1000);
    }
  };

  const roleButtonClasses = (selectedRole: Role) => 
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
          <h1 className="text-3xl font-bold text-gray-900">
            {step === 1 ? "Create your Account" : "Tell us about yourself"}
          </h1>
          <p className="text-gray-600 mt-2">
            {step === 1 ? "Join our community of artists and art enthusiasts." : `You're signing up as an ${role === 'artist' ? 'Artist' : 'Art Lover'}.`}
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
          {step === 1 ? (
            <form onSubmit={handleNextStep} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><Input id="email" type="email" placeholder="you@example.com" required className="pl-10 h-12 rounded-xl" /></div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><Input id="password" type="password" required className="pl-10 h-12 rounded-xl" placeholder="••••••••" /></div>
              </div>
              <div className="space-y-2">
                <Label>I am an...</Label>
                <div className="grid grid-cols-2 gap-4">
                  <button type="button" onClick={() => setRole('artist')} className={roleButtonClasses('artist')}><Palette className="w-8 h-8 mb-2 text-purple-600" /><span className="font-semibold text-gray-800">Artist</span></button>
                  <button type="button" onClick={() => setRole('artLover')} className={roleButtonClasses('artLover')}><Heart className="w-8 h-8 mb-2 text-pink-500" /><span className="font-semibold text-gray-800">Art Lover</span></button>
                </div>
              </div>
              <Button type="submit" disabled={!role} className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed">Continue</Button>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <div className="relative"><UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><Input id="fullName" type="text" placeholder="Your full name" required className="pl-10 h-12 rounded-xl" value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">@</span><Input id="username" type="text" placeholder="your_username" required className="pl-8 h-12 rounded-xl" value={username} onChange={(e) => setUsername(e.target.value)} /></div>
              </div>
              <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
                 <Button type="button" variant="ghost" onClick={() => setStep(1)} className="text-gray-600" disabled={isSigningUp}><ArrowLeft className="w-4 h-4 mr-2"/> Back</Button>
                 <Button type="submit" className="w-full sm:w-auto h-12 bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white rounded-xl font-semibold" disabled={isSigningUp}>
                  {isSigningUp ? <LoaderCircle className="w-5 h-5 animate-spin" /> : "Create Account"}
                 </Button>
              </div>
            </form>
          )}
        </div>
        
        <p className="text-center text-sm text-gray-600 mt-8">
          Already have an account?{' '}
          <Link to={createPageUrl('Login')} className="text-purple-600 hover:underline font-medium">Log In</Link>
        </p>
      </div>
    </div>
  );
}