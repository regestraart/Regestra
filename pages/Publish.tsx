import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Button } from "../components/ui/Button";
import { Label } from "../components/ui/Label";
import { CheckCircle, ArrowLeft, Globe } from "lucide-react";

interface LocationState {
  image?: string;
  title?: string;
  description?: string;
  tags?: string;
}

export default function Publish() {
  const navigate = useNavigate();
  const location = useLocation();
  const { image, title, description, tags } = (location.state as LocationState) || {};

  const handlePublish = () => {
    navigate(createPageUrl('Profile'));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to Edit</span>
        </button>

        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Ready to Publish?</h1>
          <p className="text-lg text-gray-600">Review your artwork before sharing it with the world</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Preview</h2>
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              {image ? (
                <img src={image} alt={title} className="w-full aspect-square object-cover" />
              ) : (
                <div className="w-full aspect-square bg-gray-100 flex items-center justify-center">
                  <p className="text-gray-400">No image uploaded</p>
                </div>
              )}
              <div className="p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{title || 'Untitled'}</h3>
                <p className="text-gray-600 mb-4">{description || 'No description provided'}</p>
                {tags && (
                  <div className="flex flex-wrap gap-2">
                    {tags.split(',').map((tag, index) => (
                      <span key={index} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                        #{tag.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Publishing Options</h2>
            <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
              <div>
                <Label className="text-sm font-medium text-gray-900 mb-3 block">Visibility</Label>
                <div className="space-y-3">
                  <label className="flex items-start gap-3 p-4 border-2 border-purple-500 bg-purple-50 rounded-xl cursor-pointer">
                    <input type="radio" name="visibility" value="public" defaultChecked className="mt-0.5"/>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Globe className="w-4 h-4 text-purple-600" />
                        <span className="font-medium text-gray-900">Public</span>
                      </div>
                      <p className="text-sm text-gray-600">Anyone can see this artwork</p>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
                    <input type="radio" name="visibility" value="private" className="mt-0.5" />
                    <div>
                      <span className="font-medium text-gray-900 block mb-1">Private</span>
                      <p className="text-sm text-gray-600">Only you can see this artwork</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <Label className="text-sm font-medium text-gray-900 mb-3">Additional Options</Label>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                    <span className="text-sm text-gray-700">Allow comments</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                    <span className="text-sm text-gray-700">Allow downloads</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                    <span className="text-sm text-gray-700">Mature content</span>
                  </label>
                </div>
              </div>

              <Button onClick={handlePublish} disabled={!image || !title} className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white rounded-xl font-semibold mt-6 disabled:opacity-50 disabled:cursor-not-allowed">
                <CheckCircle className="w-5 h-5 mr-2" />
                Publish Artwork
              </Button>

              <p className="text-xs text-center text-gray-500">
                By publishing, you agree to our{' '}
                <a href="#" className="text-purple-600 hover:underline">Content Guidelines</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}