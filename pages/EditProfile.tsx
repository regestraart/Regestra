
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Textarea } from "../components/ui/Textarea";
import { Label } from "../components/ui/Label";
import { Camera, ArrowLeft, Save } from "lucide-react";

export default function EditProfile() {
  const navigate = useNavigate();
  const [name, setName] = useState("Sarah Chen");
  const [username, setUsername] = useState("sarahchen");
  const [bio, setBio] = useState("Digital artist & illustrator | Creating colorful worlds | Available for commissions 🎨");
  const [location, setLocation] = useState("San Francisco, CA");
  const [website, setWebsite] = useState("sarahchen.art");

  const handleSave = () => {
    navigate(createPageUrl('Profile'));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate(createPageUrl('Profile'))}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to Profile</span>
        </button>

        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Edit Profile</h1>
          <p className="text-lg text-gray-600">Update your personal information and profile appearance</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8 space-y-8">
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-3 block">Cover Photo</Label>
            <div className="relative h-40 rounded-2xl overflow-hidden bg-gradient-to-r from-purple-600 to-blue-500">
              <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&h=300&fit=crop" alt="Cover" className="w-full h-full object-cover opacity-50" />
              <button className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
                <div className="bg-white rounded-full p-3"><Camera className="w-6 h-6 text-gray-700" /></div>
              </button>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700 mb-3 block">Profile Picture</Label>
            <div className="flex items-center gap-6">
              <div className="relative">
                <img src="https://i.pravatar.cc/300?img=1" alt="Profile" className="w-24 h-24 rounded-2xl" />
                <button className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity rounded-2xl">
                  <div className="bg-white rounded-full p-2"><Camera className="w-4 h-4 text-gray-700" /></div>
                </button>
              </div>
              <div>
                <Button variant="outline" className="rounded-full mb-2">
                  <Camera className="w-4 h-4 mr-2" /> Change Photo
                </Button>
                <p className="text-sm text-gray-500">JPG, PNG or GIF (Max 5MB)</p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-8 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-gray-700">Full Name *</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="h-12 rounded-xl border-gray-200 focus:border-purple-500 focus:ring-purple-500" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium text-gray-700">Username *</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">@</span>
                <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} className="h-12 pl-8 rounded-xl border-gray-200 focus:border-purple-500 focus:ring-purple-500" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio" className="text-sm font-medium text-gray-700">Bio</Label>
              <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} className="min-h-32 rounded-xl border-gray-200 focus:border-purple-500 focus:ring-purple-500 resize-none" maxLength={160} />
              <p className="text-sm text-gray-500 text-right">{bio.length}/160</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location" className="text-sm font-medium text-gray-700">Location</Label>
              <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, Country" className="h-12 rounded-xl border-gray-200 focus:border-purple-500 focus:ring-purple-500" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website" className="text-sm font-medium text-gray-700">Website</Label>
              <Input id="website" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="yourwebsite.com" className="h-12 rounded-xl border-gray-200 focus:border-purple-500 focus:ring-purple-500" />
            </div>
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <Button variant="outline" className="rounded-full px-6" onClick={() => navigate(createPageUrl('Profile'))}>Cancel</Button>
            <Button onClick={handleSave} className="bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white rounded-full px-8">
              <Save className="w-4 h-4 mr-2" /> Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
