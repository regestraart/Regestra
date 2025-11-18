
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { ArrowRight, Sparkles, Users, Palette } from "lucide-react";

const ArtworkSample = ({ image, index }: { image: string; index: number }) => {
  const [hasError, setHasError] = useState(false);

  if (hasError) return null;

  return (
    <div 
      className="group relative aspect-[4/5] rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-default"
    >
      <img 
        src={image} 
        alt={`Artwork ${index + 1}`} 
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        loading="lazy"
        onError={() => setHasError(true)}
      />
    </div>
  );
};

export default function Landing() {
  // Pool of artistic/abstract image IDs to simulate AI art
  const artworkIds = [
    "1579783902614-a3fb3927b6a5", // Abstract Waves
    "1541961017774-22349e4a1262", // Paint
    "1583339793403-3d9b001b6008", // Abstract
    "1582561424760-0b1a93b89431", // Neon
    "1547891654-e66ed7ebb968",    // Geometric
    "1578301978162-7aae4d755744", // Digital
    "1569172194622-6202a391a0a5", // Fluid
    "1565578255382-f56c2b39003e", // Abstract 2
    "1580137189272-c9379f8864fd", // Dark abstract
    "1577720580479-7d839d829c73", // Cube
    "1550684848-fac1c5b4e853",    // Urban Mirage
    "1536924940846-227afb31e2a5", // Space
    "1561214115-f2f134cc4912",    // Dark 2
    "1618005182384-a83a8bd57fbe", // Cover
    "1558470598-a5dda9640f6b",    // Paint 2
    "1563089145-599997674d42",    // Neon 2
    "1550258987-190a2d41a8ba",    // Fluid 2
    "1545239351-ef35f4394e4e",    // Geometric 2
    "1515405295579-ba7f454346a3", // Space 2
    "1558591714-0320663d6dcd"     // Abstract 3
  ];

  // Generate 100 items by cycling through the ID pool
  const artworkSamples = Array.from({ length: 100 }).map((_, i) => {
    const id = artworkIds[i % artworkIds.length];
    return `https://images.unsplash.com/photo-${id}?w=400&h=500&fit=crop&q=80`;
  });

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

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/sign-up">
                <Button size="xl" variant="primary-light" className="rounded-full font-semibold shadow-xl">
                  Create Your Free Account
                </Button>
              </Link>
              <Link to="/login">
                <Button size="xl" variant="outline-light" className="rounded-full font-semibold">
                  Login
                </Button>
              </Link>
            </div>
            
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
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Discover Amazing Art
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Browse through a curated collection of artwork from talented creators around the world
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mb-12">
            {artworkSamples.map((image, index) => (
              <ArtworkSample key={index} image={image} index={index} />
            ))}
          </div>

          <div className="text-center">
            <Link to="/home">
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
          <Link to="/sign-up">
            <Button size="xl" variant="primary-light" className="rounded-full font-semibold shadow-xl">
              Create Your Free Account
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
