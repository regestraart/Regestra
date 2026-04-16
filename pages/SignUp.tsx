
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, AlertCircle, Loader2, Database, CheckCircle2, XCircle, ClipboardCheck, ExternalLink, ShieldAlert } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { db } from '../services/db';
import { useUser } from '../context/UserContext';
import Logo from '../components/Logo';
import { isSupabaseConfigured } from '../lib/supabase';

export default function SignUp() {
  const navigate = useNavigate();
  const { setCurrentUser } = useUser();
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'artLover' as 'artist' | 'artLover'
  });
  
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [error, setError] = useState('');
  const [isDbError, setIsDbError] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const passwordsMatch = formData.password && formData.confirmPassword && formData.password === formData.confirmPassword;
  const passwordMismatch = formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword;

  useEffect(() => {
    const timer = setTimeout(async () => {
      const username = formData.username.trim();
      if (username.length < 3) {
        setUsernameStatus('idle');
        return;
      }

      setUsernameStatus('checking');
      try {
        const isAvailable = await db.users.isUsernameAvailable(username);
        setUsernameStatus(isAvailable ? 'available' : 'taken');
        if (!isAvailable) {
            setError('This username is already taken.');
        } else {
            if (error === 'This username is already taken.') setError('');
        }
      } catch (err) {
        console.error("Availability check failed", err);
        setUsernameStatus('idle');
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.username, error]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) {
        setError('');
        setIsDbError(false);
    }
  };

  const copyFixSql = () => {
      const sql = `-- REGESTRA MASTER REPAIR SCRIPT (V3 - NO OWNERSHIP ERRORS)
-- This script fixes missing columns, triggers, and permissions

-- 1. Create Types if they don't exist
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM ('artist', 'artLover');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'commission_status_enum') THEN
        CREATE TYPE public.commission_status_enum AS ENUM ('Open', 'Closed', 'Not Available');
    END IF;
END $$;

-- 2. Ensure Profiles Table & Columns exist
CREATE TABLE IF NOT EXISTS public.profiles (id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role public.user_role NOT NULL DEFAULT 'artLover';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS collections jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS commission_status public.commission_status_enum DEFAULT 'Not Available';

-- 3. Re-install Trigger Function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, username, role)
  VALUES (
    new.id, new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'username',
    COALESCE((new.raw_user_meta_data ->> 'role'), 'artLover')::public.user_role
  ) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email, full_name = EXCLUDED.full_name,
    username = EXCLUDED.username, role = EXCLUDED.role;
  RETURN new;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. Fix Table Permissions
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles" ON public.profiles;
CREATE POLICY "Public profiles" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "User update own profile" ON public.profiles;
CREATE POLICY "User update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 5. Fix STORAGE Policies (Safe version)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING ( bucket_id IN ('artworks', 'avatars') );

DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT WITH CHECK ( bucket_id IN ('artworks', 'avatars') AND auth.role() = 'authenticated' );

-- 6. Final Permissions Sync
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role, authenticated;
GRANT ALL ON TABLE storage.objects TO authenticated;
NOTIFY pgrst, 'reload schema';

SELECT 'Database and Storage policies successfully repaired!' as result;`.trim();

      navigator.clipboard.writeText(sql);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameStatus === 'taken') {
        setError('Please choose a different username.');
        return;
    }
    if (!passwordsMatch) {
        setError('Passwords do not match.');
        return;
    }
    
    setError('');
    setIsDbError(false);
    setLoading(true);

    try {
      const trimmedUsername = formData.username.toLowerCase().trim();
      const isAvailable = await db.users.isUsernameAvailable(trimmedUsername);
      if (!isAvailable) {
        throw new Error("This username is already taken. Please choose another one.");
      }

      const { data, error: sbError } = await db.auth.signUp(
        formData.email, 
        formData.password,
        {
          username: trimmedUsername,
          full_name: formData.fullName.trim(),
          role: formData.role
        }
      );

      console.log('SignUp response:', { data, sbError });
      
      if (sbError) {
        const msg = sbError.message || JSON.stringify(sbError);
        if (msg.toLowerCase().includes("database error") || msg.toLowerCase().includes("profile") || msg.toLowerCase().includes("column")) {
            setIsDbError(true);
            throw new Error("Backend setup incomplete. Your 'profiles' table is missing required columns or the trigger is broken.");
        } else if (msg.includes("User already registered") || msg.includes("already registered")) {
            throw new Error("An account with this email already exists. Please sign in instead.");
        } else if (msg.includes("email") && msg.includes("invalid")) {
            throw new Error("Please enter a valid email address.");
        } else if (msg.includes("Password") || msg.includes("password")) {
            throw new Error("Password must be at least 6 characters.");
        } else if (msg === '{}' || msg === '' || msg.includes('"message":""')) {
            throw new Error("Sign up failed. Please check your details and try again.");
        } else {
            throw new Error(msg);
        }
      }

      if (data?.user && !data?.session) {
        // Email confirmation required — show inbox screen, quiz comes after confirmation
        setIsSuccess(true);
        setLoading(false);
        return;
      }

      if (data?.user && data?.session) {
        // Auto-confirmed — UserContext will redirect to /onboarding if needed
        setLoading(false);
        navigate('/', { replace: true });
        return;
      }
    } catch (err: any) {
      const msg = err.message || '';
      if (msg === '{}' || msg === '' || msg.includes('"message":""')) {
        setError('Sign up failed. Please check your details and try again.');
      } else {
        setError(msg || 'Failed to sign up.');
      }
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
        <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
          <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center animate-fade-in">
              <div className="mb-6 flex justify-center">
                 <Logo className="h-8" />
              </div>
              <div className="mx-auto flex items-center justify-center w-16 h-16 bg-purple-50 rounded-full mb-6">
                  <Mail className="w-8 h-8 text-purple-600" />
              </div>
              <h2 className="rg-auth-heading" style={{fontSize:"1.7rem",marginBottom:8}}>Check your inbox!</h2>
              <p className="text-gray-600 mb-8">
                  We've sent a welcome email to <span className="font-semibold text-gray-900">{formData.email}</span>. Please click the link to verify your account and you're all set!
              </p>
              <Link to="/login">
                  <Button className="w-full rounded-full" variant="outline">
                      Back to Log In
                  </Button>
              </Link>
          </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-3xl shadow-sm border border-gray-100">
        {!isSupabaseConfigured && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-sm flex flex-col gap-2">
                <div className="flex items-center gap-2 font-bold"><Database className="w-4 h-4" /> Backend Not Connected</div>
                <p>Registering will create a temporary local session for testing.</p>
            </div>
        )}

        <div className="text-center">
            <Link to="/"><Logo className="h-8 mx-auto mb-6" /></Link>
          <h2 className="rg-auth-heading">Create account</h2>
          <p className="mt-2 text-sm text-gray-500">Showcase your vision to the creative world.</p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-1"><Label htmlFor="fullName" className="text-gray-700 font-semibold ml-1">Full Name</Label><Input id="fullName" name="fullName" type="text" required value={formData.fullName} onChange={handleChange} placeholder="Vincent van Gogh" className="rounded-xl h-12" /></div>
            <div className="space-y-1"><Label htmlFor="username" className="text-gray-700 font-semibold ml-1">Username</Label><div className="relative"><Input id="username" name="username" type="text" required value={formData.username} onChange={handleChange} placeholder="vincent_arts" className={`rounded-xl h-12 pr-10 ${usernameStatus === 'taken' ? 'border-red-300 focus:ring-red-500' : ''}`} /><div className="absolute right-3 top-1/2 -translate-y-1/2">{usernameStatus === 'checking' && <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />}{usernameStatus === 'available' && <CheckCircle2 className="w-4 h-4 text-green-500" />}{usernameStatus === 'taken' && <XCircle className="w-4 h-4 text-red-500" />}</div></div></div>
            <div className="space-y-1"><Label htmlFor="email" className="text-gray-700 font-semibold ml-1">Email</Label><Input id="email" name="email" type="email" autoComplete="email" required value={formData.email} onChange={handleChange} placeholder="vincent@art.com" className="rounded-xl h-12" /></div>
            <div className="space-y-1"><Label htmlFor="password" title="At least 6 characters" className="text-gray-700 font-semibold ml-1">Password</Label><Input id="password" name="password" type="password" autoComplete="new-password" required minLength={6} value={formData.password} onChange={handleChange} placeholder="••••••••" className="rounded-xl h-12" /></div>
            <div className="space-y-1"><Label htmlFor="confirmPassword" className="text-gray-700 font-semibold ml-1">Confirm Password</Label><div className="relative"><Input id="confirmPassword" name="confirmPassword" type="password" required minLength={6} value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••" className={`rounded-xl h-12 pr-10 ${passwordMismatch ? 'border-red-300 focus:ring-red-500' : ''}`} /><div className="absolute right-3 top-1/2 -translate-y-1/2">{passwordsMatch && <CheckCircle2 className="w-4 h-4 text-green-500" />}{passwordMismatch && <XCircle className="w-4 h-4 text-red-500" />}</div></div></div>
            <div className="pt-2"><Label className="text-gray-700 font-semibold ml-1">I am a...</Label><div className="mt-3 grid grid-cols-2 gap-3"><button type="button" onClick={() => setFormData(prev => ({ ...prev, role: 'artLover' }))} className={`flex items-center justify-center px-4 py-3 border rounded-2xl text-sm font-bold transition-all ${formData.role === 'artLover' ? 'border-purple-600 bg-white text-purple-700 ring-2 ring-purple-600' : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'}`}>Art Lover</button><button type="button" onClick={() => setFormData(prev => ({ ...prev, role: 'artist' }))} className={`flex items-center justify-center px-4 py-3 border rounded-2xl text-sm font-bold transition-all ${formData.role === 'artist' ? 'border-purple-600 bg-white text-purple-700 ring-2 ring-purple-600' : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'}`}>Artist</button></div></div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex flex-col gap-4 animate-slide-up">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 text-red-500 mt-0.5">
                  {isDbError ? <ShieldAlert className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                </div>
                <p className="text-sm text-red-700 font-medium leading-relaxed">
                  {error}
                </p>
              </div>

              {isDbError && (
                  <div className="bg-white/50 rounded-xl p-4 border border-red-100 flex flex-col gap-3">
                      <p className="text-xs text-red-600 font-bold uppercase tracking-wider">Troubleshooting Steps:</p>
                      <ol className="text-xs text-red-700 space-y-2 list-decimal ml-4">
                          <li>Open your **Supabase Dashboard**</li>
                          <li>Go to the **SQL Editor** tab</li>
                          <li>Click **New Query**</li>
                          <li>Paste the repair script and click **Run**</li>
                      </ol>
                      <div className="flex gap-2">
                        <Button 
                            type="button" 
                            variant="default" 
                            className="flex-1 h-9 text-xs rounded-lg bg-red-600 hover:bg-red-700" 
                            onClick={copyFixSql}
                        >
                            {copiedSql ? <><ClipboardCheck className="w-3.5 h-3.5 mr-2" /> Copied!</> : <><Database className="w-3.5 h-3.5 mr-2" /> Copy Repair SQL</>}
                        </Button>
                        <a 
                            href="https://supabase.com/dashboard/project/_/sql" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex-1"
                        >
                            <Button type="button" variant="outline" className="w-full h-9 text-xs rounded-lg border-red-200 text-red-700 hover:bg-red-50">
                                Open SQL Editor <ExternalLink className="w-3 h-3 ml-2" />
                            </Button>
                        </a>
                      </div>
                  </div>
              )}
            </div>
          )}

          <div className="pt-2">
            <Button 
                type="submit" 
                className="w-full rounded-2xl h-14 text-lg font-bold shadow-xl bg-gradient-to-r from-purple-600 to-blue-500 hover:opacity-90 transition-transform active:scale-[0.98]" 
                disabled={loading || usernameStatus === 'checking' || !passwordsMatch}
            >
                {loading ? <Loader2 className="w-6 h-6 mr-2 animate-spin" /> : null}
                {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </div>

          <p className="text-center text-sm text-gray-500">Already have an account?{' '}<Link to="/login" className="font-bold text-purple-600 hover:text-purple-500 transition-colors">Sign in</Link></p>
        </form>
      </div>
    </div>
  );
}
