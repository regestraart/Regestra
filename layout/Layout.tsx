

import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import { createUrl } from "../utils";
import { Home, Upload, MessageCircle, Search, Bell, LogIn, UserPlus } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { useUser } from "../context/UserContext";
import NotificationsPopover from "../components/NotificationsPopover";
import ProfileDropdown from "../components/ProfileDropdown";

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, setCurrentUser } = useUser();
  const isLoggedIn = !!currentUser;
  const isLanding = location.pathname === '/';
  const isAuthPage = ['/login', '/sign-up', '/forgot-password'].includes(location.pathname);
  const isHomePage = location.pathname === '/home';
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const notificationsRef = useRef<HTMLDivElement>(null);
  
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  const handleBellClick = () => {
    setShowNotifications(prev => !prev);
    if (hasUnread) {
      setHasUnread(false);
    }
  };
  
  const handleSignOut = () => {
    setCurrentUser(null);
    setShowProfileDropdown(false);
    navigate('/');
  };

  const Logo = () => (
    <div className={isLoggedIn ? "" : "cursor-pointer"} onClick={() => !isLoggedIn && navigate('/')}>
      <img
        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_691b6257d4173f2ed6ec3e95/7495ad18b_RegestraLogo.png"
        alt="Regestra"
        className="h-8"
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Logo />
            </div>

            {!isAuthPage && (
              <>
                {isLoggedIn && currentUser ? (
                  <div className="flex items-center gap-6">
                    <div className="relative w-96 hidden md:block">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Search artists, artworks..."
                        className="pl-10 bg-gray-50 border-0 rounded-full"
                      />
                    </div>
                    <nav className="flex items-center gap-1">
                      <Link to="/home-social">
                        <Button variant="ghost" size="icon" className="relative rounded-full" aria-label="Home feed">
                          <Home className="w-5 h-5" />
                        </Button>
                      </Link>
                      {currentUser.role === 'artist' && (
                        <Link to="/upload">
                          <Button variant="ghost" size="icon" className="rounded-full" aria-label="Upload artwork">
                            <Upload className="w-5 h-5" />
                          </Button>
                        </Link>
                      )}
                      <div className="relative" ref={notificationsRef}>
                        <Button variant="ghost" size="icon" className="relative rounded-full" onClick={handleBellClick} aria-label="Notifications">
                          <Bell className="w-5 h-5" />
                          {hasUnread && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-purple-600 rounded-full"></span>}
                        </Button>
                        {showNotifications && <NotificationsPopover />}
                      </div>
                      <Link to="/messages">
                        <Button variant="ghost" size="icon" className="rounded-full" aria-label="Messages">
                          <MessageCircle className="w-5 h-5" />
                        </Button>
                      </Link>
                      <div className="relative" ref={profileDropdownRef}>
                        <Button variant="ghost" size="icon" className="rounded-full" aria-label="Your profile" onClick={() => setShowProfileDropdown(prev => !prev)}>
                          <img src={currentUser.avatar} alt="profile" className="w-8 h-8 rounded-full" />
                        </Button>
                        {showProfileDropdown && <ProfileDropdown user={currentUser} onSignOut={handleSignOut} />}
                      </div>
                    </nav>
                  </div>
                ) : (
                  <nav className="flex items-center gap-6">
                    <Link to="/login" className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
                      Log In
                    </Link>
                    <Link to="/sign-up">
                      <Button className="bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white rounded-full px-6">
                        Sign Up
                      </Button>
                    </Link>
                  </nav>
                )}
              </>
            )}
          </div>
        </div>
      </header>
      
      <main>
        <Outlet />
      </main>
    </div>
  );
}
