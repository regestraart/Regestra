
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Textarea } from "../components/ui/Textarea";
import { Label } from "../components/ui/Label";
import { Upload as UploadIcon, Image as ImageIcon, X, ArrowRight, Sparkles, AlertTriangle, LoaderCircle, ShieldOff } from "lucide-react";
import { useImageEnhancer } from "../hooks/useImageEnhancer";
import { useUser } from "../context/UserContext";

export default function Upload() {
  const navigate = useNavigate();
  const { currentUser } = useUser();
  const [dragActive, setDragActive] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [fileError, setFileError] = useState<string | null>(null);
  
  const { isEnhancing, enhancementError, enhancedImage, enhanceImage, resetEnhancement } = useImageEnhancer();

  if (!currentUser || currentUser.role !== 'artist') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] text-center p-4">
        <ShieldOff className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-600 mb-6">Only users with an 'Artist' role can upload artwork.</p>
        <Link to="/home-social">
          <Button>Back to Home</Button>
        </Link>
      </div>
    );
  }

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setFileError(null);
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    setFileError(null);
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setFileError("Invalid file type. Please upload an image (JPG, PNG, GIF).");
      return;
    }

    const MIN_SIZE_KB = 100;
    if (file.size < MIN_SIZE_KB * 1024) {
        setFileError(`Image is too small. Please upload an image larger than ${MIN_SIZE_KB}KB.`);
        return;
    }

    setFileError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const originalImage = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
          const MIN_RESOLUTION = 800;
          if (img.width < MIN_RESOLUTION || img.height < MIN_RESOLUTION) {
              setFileError(`Image resolution is too low. Please upload an image that is at least ${MIN_RESOLUTION}x${MIN_RESOLUTION} pixels.`);
              return;
          }
          enhanceImage(originalImage);
      };
      img.src = originalImage;
    };
    reader.readAsDataURL(file);
  };

  const handleContinue = () => {
    navigate('/publish', {
      state: { image: enhancedImage, title, description, tags }
    });
  };
  
  const resetUpload = () => {
    resetEnhancement();
    setFileError(null);
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Upload Your Artwork</h1>
          <p className="text-lg text-gray-600">Share your creativity with the world. Every image is enhanced by AI for the best quality.</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
          <div className="mb-8">
            <Label className="text-sm font-medium text-gray-700 mb-3 block">
              Artwork Image
            </Label>
            
            {enhancedImage ? (
              <div className="relative rounded-2xl overflow-hidden bg-gray-100">
                <div className="absolute top-4 left-4 bg-black/60 text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1 backdrop-blur-sm z-10">
                  <Sparkles className="w-3 h-3" />
                  AI Enhanced
                </div>
                <img
                  src={enhancedImage}
                  alt="Uploaded artwork"
                  className="w-full max-h-96 object-contain"
                />
                <button
                  onClick={resetUpload}
                  className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
                  aria-label="Remove image"
                >
                  <X className="w-5 h-5 text-gray-700" />
                </button>
              </div>
            ) : (
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all flex items-center justify-center min-h-[300px] ${
                  dragActive
                    ? 'border-purple-500 bg-purple-50'
                    : (enhancementError || fileError)
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'
                }`}
              >
                <input type="file" id="file-upload" accept="image/*" onChange={handleChange} className="hidden" />
                
                {isEnhancing ? (
                  <div>
                    <LoaderCircle className="w-12 h-12 mx-auto text-purple-600 animate-spin" />
                    <h3 className="text-xl font-semibold text-gray-900 mt-4">Enhancing your artwork...</h3>
                    <p className="text-gray-600">Please wait, AI is improving your image quality.</p>
                  </div>
                ) : (enhancementError || fileError) ? (
                  <div className="text-red-700">
                    <AlertTriangle className="w-12 h-12 mx-auto text-red-500" />
                    <h3 className="text-xl font-semibold mt-4">Upload Failed</h3>
                    <p className="text-gray-600 mb-6">{enhancementError || fileError}</p>
                    <Button type="button" variant="outline" onClick={() => { resetUpload(); document.getElementById('file-upload')?.click(); }} className="rounded-full">
                      Try Another Image
                    </Button>
                  </div>
                ) : (
                  <div>
                    <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center">
                      <UploadIcon className="w-10 h-10 text-purple-600" />
                    </div>
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Drop your artwork here</h3>
                      <p className="text-gray-600 mb-6">or click to browse from your device</p>
                    </label>
                    <Button type="button" onClick={() => document.getElementById('file-upload')?.click()} className="bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white rounded-full px-8">
                      <ImageIcon className="w-4 h-4 mr-2" />
                      Choose File
                    </Button>
                    <p className="text-sm text-gray-500 mt-6">Supported formats: JPG, PNG, GIF (Max 10MB)</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium text-gray-700">
                Title *
              </Label>
              <Input
                id="title"
                placeholder="Give your artwork a title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-12 rounded-xl border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                Description
              </Label>
              <Textarea
                id="description"
                placeholder="Tell us about your artwork, your inspiration, or creative process..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-32 rounded-xl border-gray-200 focus:border-purple-500 focus:ring-purple-500 resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags" className="text-sm font-medium text-gray-700">
                Tags (Optional)
              </Label>
              <Input
                id="tags"
                placeholder="abstract, colorful, digital art (comma separated)"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="h-12 rounded-xl border-gray-200 focus:border-purple-500 focus:ring-purple-500"
              />
              <p className="text-sm text-gray-500">
                Add tags to help others discover your work
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
            <Button
              variant="outline"
              className="rounded-full px-6"
              onClick={() => window.history.back()}
            >
              Cancel
            </Button>
            
            <Button
              onClick={handleContinue}
              disabled={!enhancedImage || !title}
              className="bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white rounded-full px-8 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue to Publish
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}