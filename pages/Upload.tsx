import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Textarea } from "../components/ui/Textarea";
import { Label } from "../components/ui/Label";
import { Upload as UploadIcon, Image as ImageIcon, X, ArrowRight } from "lucide-react";

export default function Upload() {
  const navigate = useNavigate();
  const [dragActive, setDragActive] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
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
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleContinue = () => {
    navigate(createPageUrl('Publish'), {
      state: { image: uploadedImage, title, description, tags }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Upload Your Artwork</h1>
          <p className="text-lg text-gray-600">Share your creativity with the world</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
          <div className="mb-8">
            <Label className="text-sm font-medium text-gray-700 mb-3 block">
              Artwork Image
            </Label>
            
            {!uploadedImage ? (
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
                  dragActive
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'
                }`}
              >
                <input
                  type="file"
                  id="file-upload"
                  accept="image/*"
                  onChange={handleChange}
                  className="hidden"
                />
                
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center">
                  <UploadIcon className="w-10 h-10 text-purple-600" />
                </div>
                
                <label htmlFor="file-upload" className="cursor-pointer">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Drop your artwork here
                  </h3>
                  <p className="text-gray-600 mb-6">
                    or click to browse from your device
                  </p>
                </label>
                
                <Button
                    type="button"
                    onClick={() => document.getElementById('file-upload')?.click()}
                    className="bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white rounded-full px-8"
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Choose File
                  </Button>
                
                <p className="text-sm text-gray-500 mt-6">
                  Supported formats: JPG, PNG, GIF (Max 10MB)
                </p>
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden bg-gray-100">
                <img
                  src={uploadedImage}
                  alt="Uploaded artwork"
                  className="w-full max-h-96 object-contain"
                />
                <button
                  onClick={() => setUploadedImage(null)}
                  className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-700" />
                </button>
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
              disabled={!uploadedImage || !title}
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