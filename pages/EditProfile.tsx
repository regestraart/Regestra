
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createUrl } from "../utils";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Textarea } from "../components/ui/Textarea";
import { Label } from "../components/ui/Label";
import { Camera, ArrowLeft, Save, LoaderCircle, Sparkles, Instagram, Twitter, AlertTriangle } from "lucide-react";
import { useImageEnhancer } from "../hooks/useImageEnhancer";
import { useUser } from "../context/UserContext";
import ConfirmationModal from "../components/ConfirmationModal";
import { deleteUser } from "../data/mock";

const BehanceIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M7.938 10.148h3.324c0-1.854-1.48-1.854-3.324-1.854zm12.562 1.332c0-1.782-1.337-3.159-3.417-3.159H9.412V2.83h7.94c1.854 0 2.923 1.02 2.923 2.538h-2.923c0-.865-.63-1.02-1.289-1.02H11.5v3.13h5.717c1.94 0 3.295 1.164 3.295 3.015 0 1.996-1.508 3.102-3.417 3.102h-5.6v5.253h5.542c2.163 0 3.53-.992 3.53-2.997H17.27c0 .942-.717 1.39-1.684 1.39h-3.13V15.7h5.366c2.05 0 3.446-1.193 3.446-3.22zM8.562 18.168h-5.04V6.832h5.04c2.51 0 4.218 1.536 4.218 3.668 0 2.22-1.737 3.668-4.218 3.668zM3 21.168h6.19c3.96 0 6.72-2.135 6.72-6.192C15.91 10.95 13.12 9 9.19 9H3v12.168z" />
  </svg>
);

export default function EditProfile() {
  const navigate = useNavigate();
  const { currentUser, setCurrentUser } = useUser();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!currentUser) return null; 

  const isArtist = currentUser.role === 'artist';

  const [name, setName] = useState(currentUser.name);
  const [username, setUsername] = useState(currentUser.username);
  const [bio, setBio] = useState(currentUser.bio);
  const [location, setLocation] = useState(currentUser.location || "");
  const [website, setWebsite] = useState(currentUser.website || "");
  const [commissionStatus, setCommissionStatus] = useState(currentUser.commissionStatus || 'Not Available');
  const [contactEmail, setContactEmail] = useState(currentUser.contactEmail || "");
  const [socials, setSocials] = useState(currentUser.socials || { instagram: '', twitter: '', behance: '' });

  const [avatar, setAvatar] = useState(currentUser.avatar);
  const [cover, setCover] = useState(currentUser.coverImage);
  
  const avatarEnhancer = useImageEnhancer();
  const coverEnhancer = useImageEnhancer();

  useEffect(() => {
    if (avatarEnhancer.enhancedImage) setAvatar(avatarEnhancer.enhancedImage);
  }, [avatarEnhancer.enhancedImage]);

  useEffect(() => {
    if (coverEnhancer.enhancedImage) setCover(coverEnhancer.enhancedImage);
  }, [coverEnhancer.enhancedImage]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, enhance: (base64: string) => void) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (typeof event.target?.result === 'string') {
          enhance(event.target.result);
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSocialChange = (platform, value) => {
    setSocials(prev => ({ ...prev, [platform]: value }));
  };

  const handleSave = () => navigate(createUrl('/profile/:userId', { userId: currentUser.id }));

  const handleDeleteAccount = () => {
    deleteUser(currentUser.id);
    setCurrentUser(null);
    setShowDeleteConfirm(false);
    navigate('/');
  };

  return (
    <>
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <button onClick={() => navigate(createUrl('/profile/:userId', { userId: currentUser.id }))} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to Profile</span>
        </button>

        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Edit Profile</h1>
          <p className="text-lg text-gray-600">Update your personal information and profile appearance</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8 space-y-8">
          
          <div className="relative">
             <Label htmlFor="cover-upload" className="text-sm font-medium text-gray-700 mb-3 block">Cover Photo</Label>
              <input type="file" id="cover-upload" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, coverEnhancer.enhanceImage)} />
              <label htmlFor="cover-upload" className="cursor-pointer">
                <div className="relative h-40 rounded-2xl overflow-hidden bg-gray-200 group">
                  {cover && <img src={cover} alt="Cover" className="w-full h-full object-cover" />}
                  {coverEnhancer.isEnhancing && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white">
                      <LoaderCircle className="w-8 h-8 animate-spin" />
                      <p className="mt-2 text-sm font-semibold">Enhancing...</p>
                    </div>
                  )}
                  {coverEnhancer.enhancedImage && !coverEnhancer.isEnhancing && (
                    <div className="absolute top-2 left-2 bg-black/60 text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1 backdrop-blur-sm z-10"><Sparkles className="w-3 h-3" /> AI Enhanced</div>
                  )}
                  {!coverEnhancer.isEnhancing && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"><div className="bg-white rounded-full p-3"><Camera className="w-6 h-6 text-gray-700" /></div></div>
                  )}
                </div>
              </label>
              {coverEnhancer.enhancementError && <p className="text-sm text-red-600 mt-2">{coverEnhancer.enhancementError}</p>}
            </div>
          
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-3 block">Profile Picture</Label>
            <div className="flex items-center gap-6">
              <div className="relative">
                <input type="file" id="avatar-upload" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, avatarEnhancer.enhanceImage)} />
                <label htmlFor="avatar-upload" className="cursor-pointer">
                   <div className="relative w-24 h-24 rounded-2xl group overflow-hidden bg-gray-200">
                    <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
                    {avatarEnhancer.isEnhancing && <div className="absolute inset-0 flex items-center justify-center bg-black/60"><LoaderCircle className="w-6 h-6 animate-spin text-white" /></div>}
                    {avatarEnhancer.enhancedImage && !avatarEnhancer.isEnhancing && <div className="absolute top-1 left-1 bg-black/60 text-white text-[10px] font-semibold px-1 rounded-full flex items-center gap-0.5 backdrop-blur-sm z-10"><Sparkles className="w-2 h-2" /> AI</div>}
                    {!avatarEnhancer.isEnhancing && <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"><div className="bg-white rounded-full p-2"><Camera className="w-4 h-4 text-gray-700" /></div></div>}
                  </div>
                </label>
              </div>
              <div>
                <Button variant="outline" className="rounded-full mb-2" onClick={() => document.getElementById('avatar-upload')?.click()}><Camera className="w-4 h-4 mr-2" /> Change Photo</Button>
                <p className="text-sm text-gray-500">JPG, PNG or GIF (Max 5MB)</p>
                 {avatarEnhancer.enhancementError && <p className="text-sm text-red-600 mt-2">{avatarEnhancer.enhancementError}</p>}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-8 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-gray-700">Full Name *</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="h-12 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium text-gray-700">Username *</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">@</span>
                <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} className="h-12 pl-8 rounded-xl" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio" className="text-sm font-medium text-gray-700">Bio</Label>
              <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} className="min-h-32 rounded-xl resize-none" maxLength={160} />
              <p className="text-sm text-gray-500 text-right">{bio.length}/160</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location" className="text-sm font-medium text-gray-700">Location</Label>
              <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, Country" className="h-12 rounded-xl" />
            </div>
            
            {isArtist && (
              <div className="border-t border-gray-200 pt-8 space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Artist Details</h3>
                <div className="space-y-2">
                  <Label htmlFor="website" className="text-sm font-medium text-gray-700">Website</Label>
                  <Input id="website" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="yourwebsite.com" className="h-12 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactEmail" className="text-sm font-medium text-gray-700">Contact Email</Label>
                  <Input id="contactEmail" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="Your public email for inquiries" className="h-12 rounded-xl" />
                </div>
                <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Commission Status</Label>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2"><input type="radio" name="commission" value="Open" checked={commissionStatus === 'Open'} onChange={(e) => setCommissionStatus(e.target.value as 'Open' | 'Closed' | 'Not Available')} /> Open</label>
                        <label className="flex items-center gap-2"><input type="radio" name="commission" value="Closed" checked={commissionStatus === 'Closed'} onChange={(e) => setCommissionStatus(e.target.value as 'Open' | 'Closed' | 'Not Available')} /> Closed</label>
                        <label className="flex items-center gap-2"><input type="radio" name="commission" value="Not Available" checked={commissionStatus === 'Not Available'} onChange={(e) => setCommissionStatus(e.target.value as 'Open' | 'Closed' | 'Not Available')} /> Not Available</label>
                    </div>
                </div>
                <div className="space-y-4">
                    <Label className="text-sm font-medium text-gray-700">Social Links</Label>
                    <div className="relative"><Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><Input value={socials.instagram} onChange={(e) => handleSocialChange('instagram', e.target.value)} className="pl-10 rounded-lg" placeholder="Instagram username" /></div>
                    <div className="relative"><Twitter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><Input value={socials.twitter} onChange={(e) => handleSocialChange('twitter', e.target.value)} className="pl-10 rounded-lg" placeholder="Twitter username" /></div>
                    <div className="relative"><BehanceIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><Input value={socials.behance} onChange={(e) => handleSocialChange('behance', e.target.value)} className="pl-10 rounded-lg" placeholder="Behance username" /></div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <Button variant="outline" className="rounded-full px-6" onClick={() => navigate(createUrl('/profile/:userId', { userId: currentUser.id }))}>Cancel</Button>
            <Button onClick={handleSave} className="bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white rounded-full px-8"><Save className="w-4 h-4 mr-2" /> Save Changes</Button>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-3xl shadow-xl p-8 border border-red-200">
            <h3 className="text-lg font-semibold text-red-800">Danger Zone</h3>
            <p className="text-sm text-gray-600 mt-2 mb-4">Deleting your account is a permanent action and cannot be undone. All your data, including your profile and artworks, will be removed forever.</p>
            <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)}>
                <AlertTriangle className="w-4 h-4 mr-2" />
                Delete My Account
            </Button>
        </div>

      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slide-up { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
        .animate-slide-up { animation: slide-up 0.3s ease-out forwards; }
      `}} />
    </div>
    {showDeleteConfirm && (
        <ConfirmationModal 
            onClose={() => setShowDeleteConfirm(false)}
            onConfirm={handleDeleteAccount}
            title="Delete Account"
            description="Are you absolutely sure you want to delete your account? This action cannot be undone."
            confirmText="Yes, Delete My Account"
        />
    )}
    </>
  );
}
