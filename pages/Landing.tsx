import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Button } from "../components/ui/Button";
import { ArrowRight, Sparkles, Users, Palette } from "lucide-react";

export default function Landing() {
  const artworkSamples = [
    "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1583339793403-3d9b001b6008?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1582561424760-0b1a93b89431?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1547891654-e66ed7ebb968?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1578301978162-7aae4d755744?w=400&h=500&fit=crop"
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-purple-500 to-blue-500 text-white">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=1200')] opacity-10 bg-cover bg-center"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-8">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">The platform for your art</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
              Showcase Your<br />Creative Vision
            </h1>
            
            <p className="text-xl md:text-2xl text-purple-100 mb-10 max-w-2xl mx-auto">
              Join thousands of artists sharing their work, building their portfolio, and connecting with a vibrant creative community.
            </p>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#F9FAFB"/>
          </svg>
        </div>
      </section>

      {/* Featured Artworks */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Discover Amazing Art
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Browse through a curated collection of artwork from talented creators around the world
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-12">
            {artworkSamples.map((image, index) => (
              <div 
                key={index} 
                className="group relative aspect-[4/5] rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer"
              >
                <img 
                  src={image} 
                  alt={`Artwork ${index + 1}`} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <p className="font-semibold">Artist Name</p>
                    <p className="text-sm text-gray-200">Artwork Title</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link to={createPageUrl('Home')}>
              <Button size="lg" variant="outline" className="rounded-full px-8">
                View All Artworks
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Everything You Need
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Professional tools designed specifically for artists
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-purple-50 to-blue-50 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-purple-600 to-blue-500 rounded-2xl flex items-center justify-center">
                <Palette className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Beautiful Portfolio</h3>
              <p className="text-gray-600">
                Create a stunning online portfolio that showcases your work in the best light
              </p>
            </div>

            <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-blue-600 to-purple-500 rounded-2xl flex items-center justify-center">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Connect & Share</h3>
              <p className="text-gray-600">
                Build your audience and connect with other artists in our vibrant community
              </p>
            </div>

            <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-purple-50 to-blue-50 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-purple-600 to-blue-500 rounded-2xl flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Easy Publishing</h3>
              <p className="text-gray-600">
                Upload and publish your artwork with just a few clicks - no technical skills needed
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-blue-500 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Share Your Art?
          </h2>
          <p className="text-xl text-purple-100 mb-10">
            Join thousands of artists who trust Regestra to showcase their creative work
          </p>
          <Link to={createPageUrl('SignUp')}>
            <Button size="xl" variant="primary-light" className="rounded-full">
              Create Your Free Account
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}