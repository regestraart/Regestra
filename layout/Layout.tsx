

import React from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Home, Upload, MessageCircle, Search, Bell } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { useUser } from "../context/UserContext";

export default function Layout() {
  const location = useLocation();
  const { currentUser, switchUserRole } = useUser();
  const isLoggedIn = !!currentUser;

  const isLanding = location.pathname === createPageUrl('Landing');

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to={isLoggedIn ? createPageUrl('HomeSocial') : createPageUrl('Landing')} className="flex items-center gap-3">
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_691b6257d4173f2ed6ec3e95/7495ad18b_RegestraLogo.png"
                alt="Regestra"
                className="h-8"
              />
            </Link>
            {isLoggedIn && currentUser ? (
              <div className="flex items-center gap-6">
                <div className="relative w-96 hidden md:block">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search artists, artworks..."
                    className="pl-10 bg-gray-50 border-0 rounded-full"
                  />
                </div>
                {/* TEMPORARY: Role Switcher for Demo */}
                <div className="flex items-center gap-2 text-xs border p-1 rounded-md">
                  <span className="font-semibold hidden sm:inline">Role:</span>
                  <button onClick={() => switchUserRole('artist')} className={`px-2 py-0.5 rounded ${currentUser.role === 'artist' ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}>Artist</button>
                  <button onClick={() => switchUserRole('artLover')} className={`px-2 py-0.5 rounded ${currentUser.role === 'artLover' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Art Lover</button>
                </div>
                <nav className="flex items-center gap-1">
                  <Link to={createPageUrl('HomeSocial')}>
                    <Button variant="ghost" size="icon" className="relative rounded-full">
                      <Home className="w-5 h-5" />
                    </Button>
                  </Link>
                  {currentUser.role === 'artist' && (
                    <Link to={createPageUrl('Upload')}>
                      <Button variant="ghost" size="icon" className="rounded-full">
                        <Upload className="w-5 h-5" />
                      </Button>
                    </Link>
                  )}
                  <Button variant="ghost" size="icon" className="relative rounded-full">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-purple-600 rounded-full"></span>
                  </Button>
                  <Link to={createPageUrl('Messages')}>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <MessageCircle className="w-5 h-5" />
                    </Button>
                  </Link>
                  <Link to={createPageUrl('Profile', { userId: currentUser.id })}>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <img src={currentUser.avatar} alt="profile" className="w-8 h-8 rounded-full" />
                    </Button>
                  </Link>
                </nav>
              </div>
            ) : (
              <nav className="flex items-center gap-6">
                {!isLanding && (
                  <Link to={createPageUrl('Home')} className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
                    Explore
                  </Link>
                )}
                <Link to={createPageUrl('Login')} className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
                  Log In
                </Link>
                <Link to={createPageUrl('SignUp')}>
                  <Button className="bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white rounded-full px-6">
                    Sign Up
                  </Button>
                </Link>
              </nav>
            )}
          </div>
        </div>
      </header>
      
      <main>
        <Outlet />
      </main>

      {!isLoggedIn && (
        <footer className="bg-white border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Product</h3>
                <ul className="space-y-3">
                  <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900">Features</a></li>
                  <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900">Pricing</a></li>
                  <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900">FAQ</a></li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Company</h3>
                <ul className="space-y-3">
                  <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900">About</a></li>
                  <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900">Blog</a></li>
                  <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900">Careers</a></li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Resources</h3>
                <ul className="space-y-3">
                  <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900">Community</a></li>
                  <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900">Help Center</a></li>
                  <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900">Contact</a></li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Legal</h3>
                <ul className="space-y-3">
                  <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900">Privacy</a></li>
                  <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900">Terms</a></li>
                  <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900">License</a></li>
                </ul>
              </div>
            </div>
            <div className="mt-12 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-500 text-center">© 2024 Regestra. All rights reserved.</p>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}