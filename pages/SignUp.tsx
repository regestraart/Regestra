
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Mail, Lock, Palette, Heart, User as UserIcon, ArrowLeft, LoaderCircle, AlertTriangle, Camera, Sparkles } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { registerUser, User } from '../data/mock';
import { useImageEnhancer } from '../hooks/useImageEnhancer';

type Role = 'artist' | 'artLover';

export default function SignUp() {
  const navigate = useNavigate();
  const { setCurrentUser } = useUser();
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
      const reader = new FileReader();
      reader.onload = (event) => {
        if (typeof event.target?.result === 'string') {
          enhanceImage(event.target.result);
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };
  
  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (role && fullName && username) {
      if (!enhancedImage) {
        setError("Please upload a profile picture to create your account.");
        return;
      }

      setIsSigningUp(true);
      setError(null);
      
      setTimeout(() => {
        let newUser: Omit<User, 'id'>;

        // Mandatory profile picture - no fallback
        const finalAvatar = enhancedImage as string;

        const baseUser = {
          email,
          password,
          role,
          name: fullName,
          username,
          avatar: finalAvatar,
          bio: "",
          joinDate: new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }),
          likedArtworkIds: [],
          stats: { 
            following: 0,
            followers: 0,
          },
        };

        if (role === 'artist') {
          newUser = {
            ...baseUser,
            stats: { ...baseUser.stats, artworks: 0 },
          };
        } else { // artLover
          newUser = {
            ...baseUser,
            stats: { ...baseUser.stats, collections: 1, liked: 0 },
            collections: [{ id: 'col1', name: 'Main Collection', artworks: [] }],
          };
        }

        try {
          const registeredUser = registerUser(newUser);
          setCurrentUser(registeredUser);
          navigate('/home-social');
        } catch (err: any) {
          setError(err.message);
          setIsSigningUp(false);
        }
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
              
              {/* Profile Image Upload */}
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
                        {enhancedImage && !isEnhancing && (
                             <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                <Camera className="w-6 h-6 text-white" />
                             </div>
                        )}
                    </div>
                    {enhancedImage && (
                         <div className="absolute -top-1 -right-1 bg-purple-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white flex items-center gap-0.5 shadow-sm">
                            <Sparkles className="w-2 h-2" /> AI
                        </div>
                    )}
                    <button 
                        type="button" 
                        onClick={() => document.getElementById('signup-avatar-upload')?.click()} 
                        className="absolute bottom-0 right-0 bg-purple-600 text-white p-2 rounded-full hover:bg-purple-700 transition-colors shadow-lg border-2 border-white"
                        aria-label="Upload profile picture"
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
              {enhancementError && <p className="text-center text-xs text-red-500">{enhancementError}</p>}

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
          <Link to="/login" className="text-purple-600 hover:underline font-medium">Log In</Link>
        </p>
      </div>
    </div>
  );
}
