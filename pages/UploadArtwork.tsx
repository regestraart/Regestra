import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Upload, X, Loader2, Bookmark, AlertCircle, Sparkles, Wand2, RefreshCw,
  Palette, ImagePlus, DollarSign, Eye, EyeOff, ShieldAlert, Database,
  ClipboardCheck, ExternalLink, ShoppingBag, Lock, Award,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Textarea } from '../components/ui/Textarea';
import { db } from '../services/db';
import { useUser } from '../context/UserContext';
import { useSubscription } from '../context/SubscriptionContext';
import ApiKeyModal from '../components/ApiKeyModal';
import { IssueCertificateModal } from '../components/IssueCertificateModal';

type UploadMode = 'upload' | 'ai_studio';

export default function UploadArtwork() {
  const navigate = useNavigate();
  const { currentUser } = useUser();
  const { canIssueCerts, tier, atListingLimit, listingsRemaining, maxListings } = useSubscription();
  const [mode, setMode] = useState<UploadMode>('upload');

  const handleModeSwitch = (newMode: UploadMode) => {
    setMode(newMode);
    if (newMode === 'ai_studio') {
      // AI Studio always treats work as own artwork — no collection tab
      setIsOwnArtwork(true);
      setFormData(prev => ({ ...prev, artistName: '' }));
      // Auto-inject AI Artwork tag — always present, non-removable via submit logic
      setFormData(prev => {
        const existingTags = prev.tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
        if (!existingTags.includes('ai artwork')) {
          return { ...prev, tags: existingTags.length > 0 ? `${prev.tags}, ai artwork` : 'ai artwork' };
        }
        return prev;
      });
    }
  };

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: '',
    artistName: '',
    prompt: '',
    price: '',
    isPriceVisible: true,
    listedForSale: false as boolean,
    wantsCertificate: false,
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSuggestingPrice, setIsSuggestingPrice] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [newArtworkId, setNewArtworkId] = useState<string | null>(null);
  const [showCertModal, setShowCertModal] = useState(false);

  // Any user can upload their own artwork OR add someone else's to their collection
  // isOwnArtwork = true means "this is my original work"
  // Artists default to "My Original Work", art lovers default to "Add to Collection"
  const [isOwnArtwork, setIsOwnArtwork] = useState(currentUser?.role !== 'artLover');

  const isArtist = isOwnArtwork; // alias for existing logic
  const isSeller = formData.listedForSale === true;
  const priceToggleLocked = isSeller;
  const effectivePriceVisible = priceToggleLocked ? true : formData.isPriceVisible;
  const isSyncError = error?.includes('SYNC ERROR') || error?.includes('cache') || error?.includes('SCHEMA MISMATCH');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
    setError(null);
  };

  const handleListForSaleChange = (value: boolean) => {
    setFormData(prev => ({
      ...prev,
      listedForSale: value,
      isPriceVisible: value ? true : prev.isPriceVisible,
    }));
  };

  const handleToggleVisibility = () => {
    if (priceToggleLocked) return;
    setFormData(prev => ({ ...prev, isPriceVisible: !prev.isPriceVisible }));
  };

  const copyRepairSql = () => {
    navigator.clipboard.writeText("NOTIFY pgrst, 'reload schema';");
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  const handleForceSync = () => { window.location.reload(); };

  const handleSuggestPrice = async () => {
    if (!previewUrl) { setError('Please upload or generate an image first.'); return; }
    setIsSuggestingPrice(true);
    setError(null);
    try {
      const response = await fetch(previewUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      const base64Promise = new Promise<string>(resolve => {
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(blob);
      });
      const base64Data = await base64Promise;
      const apiResponse = await fetch('/.netlify/functions/gemini-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'suggest-price', image: { mimeType: blob.type, data: base64Data }, title: formData.title, description: formData.description }),
      });
      if (!apiResponse.ok) throw new Error('AI price suggestion failed.');
      const data = await apiResponse.json();
      setFormData(prev => ({ ...prev, price: data.suggestedPrice.toString() }));
    } catch (err: any) {
      setError("Couldn't analyze the image for pricing. Try adding a title and description first.");
    } finally {
      setIsSuggestingPrice(false);
    }
  };

  const handleGenerateAI = async () => {
    if (!formData.prompt.trim()) return;
    setIsGenerating(true);
    setError(null);
    try {
      const apiResponse = await fetch('/.netlify/functions/gemini-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'generate', prompt: formData.prompt }),
      });
      if (apiResponse.status === 429) { setShowApiKeyModal(true); throw new Error('API key quota exceeded.'); }
      if (!apiResponse.ok) { const d = await apiResponse.json(); throw new Error(d.error || 'Server error'); }
      const response = await apiResponse.json();
      const imagePart = response.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
      if (imagePart?.inlineData) {
        const dataUrl = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
        setPreviewUrl(dataUrl);
        const blob = await (await fetch(dataUrl)).blob();
        setImageFile(new File([blob], 'ai_generated_art.png', { type: imagePart.inlineData.mimeType }));
      } else {
        throw new Error('AI generation returned no image.');
      }
    } catch (err: any) {
      setError(err.message || 'Image generation failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !imageFile) return;
    setLoading(true);
    setError(null);

    if (isArtist && atListingLimit) {
      setError(`You've reached your ${maxListings} artwork listing limit for your ${tier} plan. Upgrade your plan to add more.`);
      setLoading(false);
      return;
    }

    if (formData.listedForSale && (!formData.price || parseFloat(formData.price) <= 0)) {
      setError('A price greater than $0 is required for artworks listed for sale.');
      setLoading(false);
      return;
    }

    try {
      const { publicUrl, path } = await db.storage.uploadImageWithPath('artworks', imageFile);
      const priceValue = formData.price ? parseFloat(formData.price) : undefined;

      if (isArtist || formData.listedForSale) {
        // Always inject "ai artwork" tag when using AI Studio — cannot be removed
        const rawTags = formData.tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
        const finalTags = mode === 'ai_studio' && !rawTags.includes('ai artwork')
          ? [...rawTags, 'ai artwork']
          : rawTags;

        await db.artworks.create({
          artist_id:           currentUser.id,
          title:               formData.title,
          description:         formData.description,
          image_url:           publicUrl,
          image_path:          path || undefined,
          tags:                finalTags,
          likes_count:         0,
          price:               priceValue,
          publicPrice:         priceValue,
          is_price_visible:    effectivePriceVisible,
          listed_for_sale:     !!formData.listedForSale,
          profile_visible:     true,
          marketplace_visible: !!formData.listedForSale,
        });

        // If cert requested — get the newly created artwork's ID
        if (formData.wantsCertificate && canIssueCerts) {
          const artworks = await db.artworks.getByArtist(currentUser.id);
          const newest = artworks[0];
          if (newest) {
            setNewArtworkId(newest.id);
            setShowCertModal(true);
            setLoading(false);
            return;
          }
        }

        navigate(formData.listedForSale ? '/marketplace' : `/profile/${currentUser.username}`);
      } else {
        await db.collections.add(currentUser.id, {
          id: `c${Date.now()}`,
          title: formData.title,
          artistName: formData.artistName,
          image: publicUrl,
          description: formData.description,
        });
        navigate(`/profile/${currentUser.username}`);
      }
    } catch (err: any) {
      console.error('Upload failed', err);
      setError(err.message || 'Failed to publish artwork.');
    } finally {
      setLoading(false);
    }
  };

  const publishDisabled =
    loading ||
    !imageFile ||
    !formData.title ||
    (!isArtist && !isSeller && !formData.artistName) ||
    (formData.listedForSale && (!formData.price || parseFloat(formData.price) <= 0));

  return (
    <>
      <style>{`
        .upload-page { min-height: 100vh; background: linear-gradient(135deg, #faf5ff 0%, #f0fdf4 100%); padding: clamp(16px, 4vw, 32px) clamp(12px, 4vw, 16px) 80px; }
        .upload-container { max-width: 680px; margin: 0 auto; }
        .upload-card { background: #fff; border-radius: 28px; padding: clamp(20px, 5vw, 36px); box-shadow: 0 4px 32px rgba(124,58,237,0.08); border: 1px solid #f3f0ff; }
        .cert-toggle-row { display: flex; flex-direction: column; gap: 10px; background: linear-gradient(135deg, #faf5ff, #f0fdf4); border: 1.5px solid #ede9fe; border-radius: 16px; padding: 14px 14px; }
        .cert-toggle-icon { width: 32px; height: 32px; border-radius: 9px; background: linear-gradient(135deg, #7c3aed, #0d9488); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .toggle-sw { width: 48px; height: 26px; border-radius: 99px; border: none; cursor: pointer; position: relative; transition: background 200ms; flex-shrink: 0; }
        .toggle-sw.on { background: linear-gradient(135deg, #7c3aed, #0d9488); }
        .toggle-sw.off { background: #e5e7eb; }
        .toggle-th { position: absolute; top: 3px; width: 20px; height: 20px; border-radius: 50%; background: #fff; transition: left 200ms; box-shadow: 0 1px 3px rgba(0,0,0,0.2); }
        .toggle-th.on { left: 25px; }
        .toggle-th.off { left: 3px; }
      `}</style>

      <div className="upload-page">
        <div className="upload-container">
          {/* Mode tabs */}
          <div className="flex gap-2 mb-6 bg-white rounded-2xl p-1.5 border border-purple-100 shadow-sm w-fit mx-auto">
            {(['upload', 'ai_studio'] as UploadMode[]).map(m => (
              <button key={m} type="button" onClick={() => handleModeSwitch(m)}
                className={`px-3 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-black uppercase tracking-widest transition-all ${mode === m ? 'bg-purple-600 text-white shadow-md' : 'text-gray-400 hover:text-purple-600'}`}>
                {m === 'upload' ? <><ImagePlus className="w-4 h-4 inline mr-2" />Upload</> : <><Wand2 className="w-4 h-4 inline mr-2" />AI Studio</>}
              </button>
            ))}
          </div>

          <div className="upload-card">
            <h1 className="text-2xl font-black text-gray-900 mb-6">
              Add Artwork
            </h1>

            {/* Own artwork vs collecting — hidden in AI Studio mode (always treated as own work) */}
            {mode === 'upload' && (
              <div className="flex gap-3 mb-6">
                {currentUser?.role === 'artLover' ? (
                  <>
                    <button type="button"
                      onClick={() => { setIsOwnArtwork(false); setFormData(prev => ({ ...prev, wantsCertificate: false, listedForSale: false })); }}
                      className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wide border-2 transition-all ${!isOwnArtwork ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-400 border-gray-200 hover:border-gray-400'}`}>
                      Add to Collection
                    </button>
                    <button type="button"
                      onClick={() => { setIsOwnArtwork(true); setFormData(prev => ({ ...prev, artistName: '' })); }}
                      className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wide border-2 transition-all ${isOwnArtwork ? 'bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-200/50' : 'bg-white text-gray-400 border-gray-200 hover:border-purple-300 hover:text-purple-600'}`}>
                      My Original Work
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button"
                      onClick={() => { setIsOwnArtwork(true); setFormData(prev => ({ ...prev, artistName: '' })); }}
                      className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wide border-2 transition-all ${isOwnArtwork ? 'bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-200/50' : 'bg-white text-gray-400 border-gray-200 hover:border-purple-300 hover:text-purple-600'}`}>
                      My Original Work
                    </button>
                    <button type="button"
                      onClick={() => { setIsOwnArtwork(false); setFormData(prev => ({ ...prev, wantsCertificate: false, listedForSale: false })); }}
                      className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wide border-2 transition-all ${!isOwnArtwork ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-400 border-gray-200 hover:border-gray-400'}`}>
                      Add to Collection
                    </button>
                  </>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Image */}
              {mode === 'upload' ? (
                <div>
                  <Label className="text-[12px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Artwork Image *</Label>
                  {previewUrl ? (
                    <div className="relative rounded-2xl overflow-hidden border-2 border-purple-100">
                      <img src={previewUrl} alt="Preview" className="w-full max-h-80 object-contain bg-gray-50" />
                      <button type="button" onClick={() => { setPreviewUrl(null); setImageFile(null); }}
                        className="absolute top-3 right-3 bg-white rounded-full p-1.5 shadow-lg border border-gray-200 hover:bg-red-50">
                        <X className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-52 border-2 border-dashed border-purple-200 rounded-2xl cursor-pointer hover:border-purple-400 hover:bg-purple-50/30 transition-all">
                      <ImagePlus className="w-10 h-10 text-purple-300 mb-3" />
                      <span className="text-sm font-bold text-gray-400">Click to upload or drag & drop</span>
                      <span className="text-xs text-gray-300 mt-1">PNG, JPG, WEBP up to 20MB</span>
                      <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                    </label>
                  )}
                </div>
              ) : (
                <div>
                  <Label className="text-[12px] font-black text-gray-400 uppercase tracking-widest mb-2 block">AI Prompt</Label>
                  <div className="flex flex-col gap-2">
                    <Textarea name="prompt" value={formData.prompt} onChange={handleChange}
                      placeholder="Describe the artwork you want to generate..."
                      className="rounded-2xl border-purple-100 resize-none w-full" rows={4} />
                    <Button type="button" onClick={handleGenerateAI} disabled={isGenerating || !formData.prompt.trim()}
                      className="rounded-2xl h-11 w-full font-black bg-purple-600 hover:bg-purple-700 flex items-center justify-center gap-2">
                      {isGenerating
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                        : <><Palette className="w-4 h-4" /> Generate Artwork</>
                      }
                    </Button>
                  </div>
                  {previewUrl && (
                    <div className="relative rounded-2xl overflow-hidden border-2 border-purple-100 mt-3">
                      <img src={previewUrl} alt="AI Generated" className="w-full max-h-80 object-contain bg-gray-50" />
                    </div>
                  )}
                </div>
              )}

            {/* Claim with cert banner — shown in Add to Collection mode */}
            {!isArtist && (
              <Link to="/claim" style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  background: 'linear-gradient(135deg, #f0fdf4, #faf5ff)',
                  border: '1.5px solid #86efac', borderRadius: 16,
                  padding: '14px 18px', marginBottom: 8, cursor: 'pointer',
                  transition: 'box-shadow 150ms',
                }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(13,148,136,0.15)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                >
                  <div style={{
                    width: 40, height: 40, borderRadius: 11, flexShrink: 0,
                    background: 'linear-gradient(135deg, #7c3aed, #0d9488)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Award className="w-5 h-5" style={{ color: '#fff' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#1a1729' }}>
                      Have a Certificate of Authenticity?
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#0d9488', marginTop: 2, fontWeight: 600 }}>
                      Claim your artwork with your cert number →
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {/* Divider with OR label */}
            {!isArtist && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0 8px' }}>
                <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em' }}>or add manually</span>
                <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
              </div>
            )}

              {/* Title */}
              <div>
                <Label htmlFor="title" className="text-[12px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Title *</Label>
                <Input id="title" name="title" value={formData.title} onChange={handleChange} placeholder="Artwork title" required className="rounded-2xl h-12 border-gray-200 focus:ring-purple-500" />
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description" className="text-[12px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Description</Label>
                <Textarea id="description" name="description" value={formData.description} onChange={handleChange} placeholder="Tell the story of this piece..." className="rounded-2xl border-gray-200 focus:ring-purple-500 resize-none" rows={3} />
              </div>

              {/* Tags */}
              <div>
                <Label htmlFor="tags" className="text-[12px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Tags</Label>
                {mode === 'ai_studio' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      {/* Locked AI Artwork tag */}
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        background: 'linear-gradient(135deg, #7c3aed, #0d9488)',
                        color: '#fff', fontSize: '0.75rem', fontWeight: 800,
                        padding: '4px 12px', borderRadius: 99,
                        letterSpacing: '0.02em',
                      }}>
                        ✦ AI Artwork
                      </span>
                      <span style={{ fontSize: '0.7rem', color: '#9ca3af', fontStyle: 'italic' }}>
                        Required — cannot be removed
                      </span>
                    </div>
                    <Input
                      id="tags" name="tags"
                      value={formData.tags.split(',').map(t => t.trim()).filter(t => t.toLowerCase() !== 'ai artwork').join(', ')}
                      onChange={e => {
                        // Keep ai artwork tag, merge with user input
                        const userTags = e.target.value;
                        setFormData(prev => ({ ...prev, tags: userTags ? `ai artwork, ${userTags}` : 'ai artwork' }));
                      }}
                      placeholder="Add more tags (optional)"
                      className="rounded-2xl h-12 border-gray-200 focus:ring-purple-500"
                    />
                  </div>
                ) : (
                  <Input id="tags" name="tags" value={formData.tags} onChange={handleChange} placeholder="abstract, oil, portrait (comma separated)" className="rounded-2xl h-12 border-gray-200 focus:ring-purple-500" />
                )}
              </div>

              {/* Artist name (collectors only) */}
              {!isArtist && (
                <div>
                  <Label htmlFor="artistName" className="text-[12px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Artist Name</Label>
                  <Input id="artistName" name="artistName" value={formData.artistName} onChange={handleChange} placeholder="Name of the artist" className="rounded-2xl h-12 border-gray-200 focus:ring-purple-500" />
                </div>
              )}

              {/* List for sale */}
              <div className="space-y-3 pt-6 border-t border-gray-50">
                <label className="text-[12px] font-black text-gray-400 uppercase tracking-widest">List for Sale</label>
                <div className="flex gap-3">
                  <button type="button" onClick={() => handleListForSaleChange(false)}
                    className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wide border-2 transition-all ${!formData.listedForSale ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-400 border-gray-200 hover:border-gray-400'}`}>
                    Not for Sale
                  </button>
                  <button type="button" onClick={() => handleListForSaleChange(true)}
                    className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wide border-2 transition-all ${formData.listedForSale ? 'bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-200/50' : 'bg-white text-gray-400 border-gray-200 hover:border-purple-300 hover:text-purple-600'}`}>
                    List for Sale
                  </button>
                </div>
              </div>

              {/* Pricing */}
              {(isArtist || formData.listedForSale) && (
                <div className="space-y-4 bg-purple-50/30 p-5 rounded-3xl border border-purple-100/50">
                  <div className="flex items-center justify-between">
                    {/* Left: label */}
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
                      <span className="text-[11px] font-black text-purple-600 uppercase tracking-widest leading-none">
                        Public Pricing
                      </span>
                      {isSeller && <span className="text-[10px] font-bold text-red-400 ml-0.5">*</span>}
                    </div>
                    {/* Right: toggle + visible/hidden label stacked below */}
                    <div className="flex flex-col items-end gap-1">
                      {priceToggleLocked ? (
                        <>
                          <div className="w-11 h-6 rounded-full bg-purple-600 relative flex-shrink-0 opacity-60 cursor-not-allowed">
                            <div className="absolute top-1 left-6 w-4 h-4 bg-white rounded-full shadow-sm" />
                          </div>
                          <span className="text-[10px] font-bold text-green-600 flex items-center gap-0.5 uppercase tracking-wide">
                            <Eye className="w-2.5 h-2.5" /> Visible <Lock className="w-2.5 h-2.5 ml-0.5 text-purple-400" />
                          </span>
                        </>
                      ) : (
                        <>
                          <button type="button" onClick={handleToggleVisibility}
                            className={`w-11 h-6 rounded-full transition-all relative flex-shrink-0 ${formData.isPriceVisible ? 'bg-purple-600' : 'bg-gray-300'}`}>
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${formData.isPriceVisible ? 'left-6' : 'left-1'}`} />
                          </button>
                          <span className={`text-[10px] font-bold flex items-center gap-0.5 uppercase tracking-wide ${formData.isPriceVisible ? 'text-green-600' : 'text-gray-400'}`}>
                            {formData.isPriceVisible
                              ? <><Eye className="w-2.5 h-2.5" /> Visible</>
                              : <><EyeOff className="w-2.5 h-2.5" /> Hidden</>}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-3 items-stretch">
                    <div className="relative flex-1">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      <Input id="price" name="price" type="number" min={isSeller ? '0.01' : '0'} step="0.01"
                        value={formData.price} onChange={handleChange} placeholder="0.00"
                        className="rounded-2xl h-12 pl-9 border-purple-100 focus:ring-purple-500 text-base font-bold shadow-sm w-full" />
                    </div>
                    <Button type="button" variant="ghost" onClick={handleSuggestPrice} disabled={isSuggestingPrice || !previewUrl}
                      className="rounded-2xl h-12 px-4 border border-purple-100 bg-white hover:bg-purple-50 text-purple-600 font-bold transition-all shadow-sm flex items-center gap-2 whitespace-nowrap flex-shrink-0">
                      {isSuggestingPrice ? <RefreshCw className="w-4 h-4 animate-spin" /> : <><Sparkles className="w-4 h-4" /><span className="text-sm">AI Suggest</span></>}
                    </Button>
                  </div>
                </div>
              )}

              {/* Certificate of Authenticity toggle — artists only */}
              {isArtist && (
                <div className="cert-toggle-row">
                  {/* Top row: icon + full title */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="cert-toggle-icon">
                      <Award size={15} color="#fff" />
                    </div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#1a1729', letterSpacing: '-0.01em' }}>
                      Certificate of Authenticity
                    </div>
                  </div>
                  {/* Bottom row: subtitle on left, toggle on right */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 42 }}>
                    {canIssueCerts ? (
                      <div style={{ fontSize: '0.68rem', color: '#6b7280' }}>
                        {tier === 'pro' ? 'Solana anchored · issued after publishing' : 'SHA-256 secured · issued after publishing'}
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.68rem', color: '#7c3aed', fontWeight: 600 }}>
                        Requires Creator or Pro · <a href="/subscription" style={{ textDecoration: 'underline' }}>Upgrade</a>
                      </div>
                    )}
                    <button
                      type="button"
                      disabled={!canIssueCerts}
                      onClick={() => canIssueCerts && setFormData(prev => ({ ...prev, wantsCertificate: !prev.wantsCertificate }))}
                      className={`toggle-sw ${formData.wantsCertificate && canIssueCerts ? 'on' : 'off'}`}
                      style={{ opacity: canIssueCerts ? 1 : 0.4, cursor: canIssueCerts ? 'pointer' : 'not-allowed', flexShrink: 0, marginLeft: 12 }}
                    >
                      <div className={`toggle-th ${formData.wantsCertificate && canIssueCerts ? 'on' : 'off'}`} />
                    </button>
                  </div>
                </div>
              )}

              {/* Errors */}
              {isSyncError && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 space-y-3">
                  <div className="flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-black text-amber-800 uppercase tracking-wide">Database Sync Required</p>
                      <p className="text-xs text-amber-600 mt-1">{error}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button type="button" onClick={copyRepairSql}
                      className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-amber-700 transition-colors">
                      {copiedSql ? <><ClipboardCheck className="w-3.5 h-3.5" />Copied!</> : <><Database className="w-3.5 h-3.5" />Copy SQL</>}
                    </button>
                    <button type="button" onClick={handleForceSync}
                      className="flex items-center gap-1.5 px-4 py-2 bg-white border border-amber-200 text-amber-700 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-amber-50 transition-colors">
                      <RefreshCw className="w-3.5 h-3.5" /> Refresh
                    </button>
                  </div>
                </div>
              )}
              {error && !isSyncError && (
                <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-2xl">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-600 font-semibold">{error}</p>
                </div>
              )}

              {/* Footer */}
              {/* Listing usage indicator */}
              {isArtist && (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: atListingLimit ? '#fef2f2' : '#f9f8ff',
                  border: `1px solid ${atListingLimit ? '#fca5a5' : '#ede9fe'}`,
                  borderRadius: 12, padding: '10px 14px', marginBottom: 8,
                }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: atListingLimit ? '#ef4444' : '#6b7280' }}>
                    {atListingLimit
                      ? `Listing limit reached (${maxListings}/${maxListings})`
                      : `${listingsRemaining} listing${listingsRemaining !== 1 ? 's' : ''} remaining this plan`
                    }
                  </span>
                  {atListingLimit && (
                    <a href="/subscription" style={{ fontSize: '0.72rem', fontWeight: 700, color: '#7c3aed', textDecoration: 'none' }}>
                      Upgrade →
                    </a>
                  )}
                </div>
              )}

              <div className="pt-6 flex flex-col-reverse sm:flex-row items-center justify-between gap-4">
                <Button type="button" variant="ghost" onClick={() => navigate(-1)} disabled={loading}
                  className="w-full sm:w-auto rounded-2xl px-6 h-11 sm:h-14 text-sm font-bold text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors">
                  Discard Draft
                </Button>
                <Button type="submit" size="xl"
                  className="rounded-2xl shadow-xl shadow-purple-200 w-full sm:flex-1 sm:max-w-[320px] h-11 sm:h-14 font-bold uppercase tracking-wide text-xs sm:text-[13px]"
                  disabled={publishDisabled}>
                  {loading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Publishing...</>
                  ) : formData.wantsCertificate && canIssueCerts ? (
                    <><Award className="w-4 h-4 mr-2" /> Publish & Certify</>
                  ) : isArtist ? (
                    <><Upload className="w-4 h-4 mr-2" /> Share to Gallery</>
                  ) : isSeller ? (
                    <><ShoppingBag className="w-4 h-4 mr-2" /> Publish Listing</>
                  ) : (
                    <><Bookmark className="w-4 h-4 mr-2" /> Add to Collection</>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {showApiKeyModal && <ApiKeyModal onClose={() => setShowApiKeyModal(false)} />}

      {showCertModal && newArtworkId && currentUser && (
        <IssueCertificateModal
          artwork={{
            id: newArtworkId,
            title: formData.title,
            image: previewUrl ?? undefined,
            description: formData.description,
            price: formData.price ? parseFloat(formData.price) : null,
          }}
          artist={{
            id: currentUser.id,
            name: currentUser.name,
            username: currentUser.username,
          }}
          isAiGenerated={mode === 'ai_studio'}
          onCancel={async () => {
            // Roll back — delete the just-created artwork entirely
            try {
              await db.artworks.deleteEverywhere(newArtworkId, currentUser.id);
            } catch {
              // If deleteEverywhere fails (e.g. cert was partially created),
              // fall back to hiding it from profile and marketplace
              try {
                await db.artworks.removeFromProfile(newArtworkId, currentUser.id);
              } catch { /* ignore */ }
            }
          }}
          onClose={() => {
            // onCancel already ran — go back to upload page so user can try again
            setShowCertModal(false);
            navigate('/upload');
          }}
          onIssued={() => {
            setShowCertModal(false);
            navigate(formData.listedForSale ? '/marketplace' : `/profile/${currentUser.username}`);
          }}
        />
      )}
    </>
  );
}
