
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Mail, Lock, Palette, Heart, User as UserIcon, ArrowLeft, LoaderCircle, AlertTriangle, Camera, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useImageEnhancer } from '../hooks/useImageEnhancer';

type Role = 'artist' | 'artLover';

const DEFAULT_AVATAR_URL = "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png";

export default function SignUp() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<Role | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { isEnhancing, enhancementError, enhancedImage, enhanceImage } = useImageEnhancer();

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (role && email && password) {
      setStep(2);
    } else if (!role) {
      setError("Please select a role.")
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
         setError("Please upload a valid image file.");
         return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (typeof event.target?.result === 'string') {
          enhanceImage(event.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (role && fullName && username) {
      setIsSigningUp(true);
      setError(null);
      
      try {
        // 1. Sign up with Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error("No user returned from sign up");

        // 2. Insert extra details into 'users' table
        const finalAvatar = (enhancedImage as string) || DEFAULT_AVATAR_URL;

        const { error: dbError } = await supabase.from('users').insert([{
          id: authData.user.id, // Important: Match the Auth ID
          email,
          role,
          name: fullName,
          username,
          avatar_url: finalAvatar, 
          bio: "",
          stats: { following: 0, followers: 0, artworks: 0, collections: 0, liked: 0 }
        }]);

        if (dbError) {
          // Critical: If DB insert fails, sign out immediately to prevent a "zombie" session
          await supabase.auth.signOut();
          throw dbError;
        }

        navigate('/home-social');
      } catch (err: any) {
        setError(err.message || "Registration failed. Please try again.");
        setIsSigningUp(false);
      }
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
          <h1 className="text-3xl font-bold text-gray-900">
            {step === 1 ? "Create your Account" : "Tell us about yourself"}
          </h1>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
          {step === 1 ? (
            <form onSubmit={handleNextStep} className="space-y-6">
              {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-lg flex items-center gap-2 text-sm">
                <AlertTriangle className="w-4 h-4" />
                {error}
              </div>
            )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><Input id="email" type="email" placeholder="you@example.com" required className="pl-10 h-12 rounded-xl" value={email} onChange={e => setEmail(e.target.value)} /></div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><Input id="password" type="password" required className="pl-10 h-12 rounded-xl" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} /></div>
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
               {error && (
                <div className="bg-red-50 text-red-700 p-3 rounded-lg flex items-center gap-2 text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  {error}
                </div>
              )}
              
              <div className="flex justify-center mb-6">
                <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-4 border-white shadow-md">
                        {isEnhancing ? (
                            <LoaderCircle className="w-8 h-8 text-purple-600 animate-spin" />
                        ) : enhancedImage ? (
                            <img src={enhancedImage} alt="Profile Preview" className="w-full h-full object-cover" />
                        ) : (
                            <UserIcon className="w-10 h-10 text-gray-300" />
                        )}
                    </div>
                    <button 
                        type="button" 
                        onClick={() => document.getElementById('signup-avatar-upload')?.click()} 
                        className="absolute bottom-0 right-0 bg-purple-600 text-white p-2 rounded-full hover:bg-purple-700 transition-colors shadow-lg border-2 border-white"
                    >
                        <Camera className="w-4 h-4" />
                    </button>
                    <input 
                        type="file" 
                        id="signup-avatar-upload" 
                        className="hidden" 
                        accept="image/*" 
                        onChange={handleFileChange} 
                    />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" type="text" placeholder="Your full name" required className="pl-4 h-12 rounded-xl" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">@</span><Input id="username" type="text" placeholder="your_username" required className="pl-8 h-12 rounded-xl" value={username} onChange={(e) => setUsername(e.target.value)} /></div>
              </div>
              <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
                 <Button type="button" variant="ghost" onClick={() => setStep(1)} className="text-gray-600" disabled={isSigningUp}><ArrowLeft className="w-4 h-4 mr-2"/> Back</Button>
                 <Button type="submit" className="w-full sm:w-auto h-12 bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white rounded-xl font-semibold" disabled={isSigningUp || isEnhancing}>
                  {isSigningUp ? <LoaderCircle className="w-5 h-5 animate-spin" /> : "Create Account"}
                 </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
