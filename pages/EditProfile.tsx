
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
import { deleteUser, updateUserProfile } from "../data/mock";

const BehanceIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M7.938 10.148h3.324c0-1.854-1.48-1.854-3.324-1.854zm12.562 1.332c0-1.782-1.337-3.159-3.417-3.159H9.412V2.83h7.94c1.854 0 2.923 1.02 2.923 2.538h-2.923c0-.865-.63-1.02-1.289-1.02H11.5v3.13h5.717c1.94 0 3.295 1.164 3.295 3.015 0 1.996-1.508 3.102-3.417 3.102h-5.6v5.253h5.542c2.163 0 3.53-.992 3.53-2.997H17.27c0 .942-.717 1.39-1.684 1.39h-3.13V15.7h5.366c2.05 0 3.446-1.193 3.446-3.22zM8.562 18.168h-5.04V6.832h5.04c2.51 0 4.218 1.536 4.218 3.668 0 2.22-1.737 3.668-4.218 3.668zM3 21.168h6.19c3.96 0 6.72-2.135 6.72-6.192C15.91 10.95 13.12 9 9.19 9H3v12.168z" /></svg>
);

export default function EditProfile() {
  const navigate = useNavigate();
  const { currentUser, setCurrentUser } = useUser();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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

  const handleSave = async () => {
    if (currentUser) {
        setIsSaving(true);
        try {
            const updatedUser = await updateUserProfile(currentUser.id, {
                name, username, bio, location, website,
                commissionStatus: commissionStatus as any,
                contactEmail, socials, avatar, coverImage: cover
            });
            setCurrentUser(updatedUser);
            navigate(createUrl('/profile/:userId', { userId: currentUser.id }));
        } catch (e) {
            alert("Failed to update profile");
        } finally {
            setIsSaving(false);
        }
    }
  };

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
        <div className="text-center mb-10"><h1 className="text-4xl font-bold text-gray-900 mb-3">Edit Profile</h1></div>
        <div className="bg-white rounded-3xl shadow-xl p-8 space-y-8">
          {/* Cover & Avatar sections simplified for brevity, they use state directly */}
          <div className="relative">
             <Label className="text-sm font-medium text-gray-700 mb-3 block">Cover Photo</Label>
              <input type="file" id="cover-upload" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, coverEnhancer.enhanceImage)} />
              <label htmlFor="cover-upload" className="cursor-pointer block h-40 bg-gray-200 rounded-2xl overflow-hidden">
                 {cover && <img src={cover} className="w-full h-full object-cover" />}
              </label>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-3 block">Profile Picture</Label>
            <div className="flex items-center gap-6">
               <input type="file" id="avatar-upload" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, avatarEnhancer.enhanceImage)} />
               <label htmlFor="avatar-upload" className="cursor-pointer w-24 h-24 bg-gray-200 rounded-2xl overflow-hidden block">
                  <img src={avatar} className="w-full h-full object-cover" />
               </label>
               <Button variant="outline" onClick={() => document.getElementById('avatar-upload')?.click()}><Camera className="w-4 h-4 mr-2"/> Change Photo</Button>
            </div>
          </div>

          <div className="space-y-6 pt-6 border-t">
             <div><Label>Full Name</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
             <div><Label>Username</Label><Input value={username} onChange={e => setUsername(e.target.value)} /></div>
             <div><Label>Bio</Label><Textarea value={bio} onChange={e => setBio(e.target.value)} /></div>
             <div><Label>Location</Label><Input value={location} onChange={e => setLocation(e.target.value)} /></div>
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <Button variant="outline" onClick={() => navigate(createUrl('/profile/:userId', { userId: currentUser.id }))}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving} className="bg-purple-600 text-white">
                {isSaving ? <LoaderCircle className="animate-spin w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />} Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
