import React, { useState, useRef, useEffect, useCallback } from "react";
import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import { Upload, MessageCircle, Bell, Loader2, ShoppingBag, Shield, Award, Home } from "lucide-react";
import { Button } from "../components/ui/Button";
import { useUser, _setNavigateRegistry } from "../context/UserContext";
import NotificationsPopover from "../components/NotificationsPopover";
import ProfileDropdown from "../components/ProfileDropdown";
import { db } from "../services/db";
import { SupabaseDebug } from "../components/SupabaseDebug";
import Logo from "../components/Logo";
import { supabase } from "../lib/supabase";
import { SearchComponent } from "../components/Search";
import AuthCallback from "../pages/AuthCallback";
import ChangePasswordModal from "../components/ChangePasswordModal";
import Footer from "../components/Footer";
import MobileNavFooter from "../components/MobileNavFooter";

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, setCurrentUser, refreshCurrentUser, isLoading } = useUser();
  const isAuthPage = ["/login", "/sign-up", "/forgot-password", "/admin"].includes(location.pathname);

  // Register navigate once on mount so UserContext can do soft navigation
  useEffect(() => { _setNavigateRegistry(navigate); }, []);

  const [showNotifications, setShowNotifications] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Stable ref so callbacks don't need currentUser in their dep arrays
  const currentUserRef = useRef(currentUser);
  useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);

  const checkAllUnreadStatus = useCallback(async () => {
    const cu = currentUserRef.current;
    if (!cu) { setHasUnread(false); setHasUnreadMessages(false); return; }
    try {
      const [n, m] = await Promise.all([
        db.notifications.getUnreadCount(cu.id),
        db.chat.getUnreadCount(cu.id),
      ]);
      setHasUnread(n > 0);
      setHasUnreadMessages(m > 0);
    } catch {}
  }, []); // stable — currentUser accessed via ref

  useEffect(() => {
    let ch: any, mch: any;
    const cu = currentUserRef.current;
    if (cu) {
      checkAllUnreadStatus();
      ch = supabase.channel(`public:notifications:${cu.id}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${cu.id}` },
          (p) => { setHasUnread(true); const n = p.new as any; if (n.type === "follow" || n.type === "connect_request") refreshCurrentUser(); })
        .subscribe();
      mch = supabase.channel(`public:messages_layout:${cu.id}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => checkAllUnreadStatus())
        .subscribe();
    } else { setHasUnread(false); setHasUnreadMessages(false); }
    return () => { if (ch) supabase.removeChannel(ch); if (mch) supabase.removeChannel(mch); };
  }, [currentUser?.id, checkAllUnreadStatus, refreshCurrentUser]); // currentUser?.id is a stable string — only changes on sign in/out

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) setShowNotifications(false);
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target as Node)) setShowProfileDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSignOut = async () => { await setCurrentUser(null); setShowProfileDropdown(false); navigate("/"); };
  const handleMarkMessagesRead = async () => {
    if (currentUser && hasUnreadMessages) {
      setHasUnreadMessages(false);
      try { await db.chat.markAllAsRead(currentUser.id); } catch { checkAllUnreadStatus(); }
    }
  };

  const rawUrl = window.location.href.toLowerCase();
  const isAuthRedirect = rawUrl.includes("access_token=") || rawUrl.includes("type=recovery") || rawUrl.includes("refresh_token=") || rawUrl.includes("error=");
  const shouldIntercept = isAuthRedirect && !location.pathname.startsWith("/auth-callback");

  return (
    <div className="min-h-screen bg-gray-50">
      {!isAuthPage && (
        <header
          className="bg-white sticky top-0 z-50"
          style={{ borderBottom: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
              {/* Logo — not clickable to social feed */}
              <span style={{ cursor: "default", display: "inline-flex" }}><Logo className="h-7 w-auto" /></span>

              {isLoading && !currentUser ? (
                <div className="flex items-center justify-center w-40">
                  <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
                </div>
              ) : currentUser ? (
                /* ── Authenticated nav ── */
                <>
                  {/* ── DESKTOP / TABLET layout (md+): logo | search | icons ── */}
                  <div className="hidden md:flex items-center gap-6">
                    <div className="w-96 desktop-search-bar"><SearchComponent /></div>
                    <nav className="flex items-center gap-1">
                      {/* Home button — links to Social Posts feed */}
                      <Link to="/">
                        <Button variant="ghost" size="icon" className="rounded-full" title="Home">
                          <Home className="w-5 h-5" />
                        </Button>
                      </Link>
                      <Link to="/marketplace"><Button variant="ghost" size="icon" className="rounded-full"><ShoppingBag className="w-5 h-5" /></Button></Link>
                      <Link to="/verify"><Button variant="ghost" size="icon" className="rounded-full" title="Verify Certificate"><Award className="w-5 h-5" /></Button></Link>
                      <Link to="/upload"><Button variant="ghost" size="icon" className="rounded-full"><Upload className="w-5 h-5" /></Button></Link>
                      <Link to="/messages" onClick={handleMarkMessagesRead}>
                        <Button variant="ghost" size="icon" className="relative rounded-full">
                          <MessageCircle className="w-5 h-5" />
                          {hasUnreadMessages && <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />}
                        </Button>
                      </Link>
                      {/* Bell */}
                      <div className="relative" ref={notificationsRef}>
                        <Button variant="ghost" size="icon" className="relative rounded-full" onClick={() => setShowNotifications(p => !p)}>
                          <Bell className="w-5 h-5" />
                          {hasUnread && <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />}
                        </Button>
                        {showNotifications && <NotificationsPopover onClose={() => setShowNotifications(false)} onNotificationsRead={checkAllUnreadStatus} />}
                      </div>
                      {currentUser?.is_admin && (
                        <Link to="/admin">
                          <Button variant="ghost" size="icon" className="rounded-full" title="Admin Dashboard">
                            <Shield className="w-5 h-5 text-purple-600" />
                          </Button>
                        </Link>
                      )}
                      {/* Profile avatar — desktop/tablet only */}
                      <div className="relative" ref={profileDropdownRef}>
                        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setShowProfileDropdown(p => !p)}>
                          <img src={currentUser.avatar} alt="profile" className="w-8 h-8 rounded-full object-cover" />
                        </Button>
                        {showProfileDropdown && (
                          <ProfileDropdown
                            user={currentUser}
                            onSignOut={handleSignOut}
                            onNavigate={() => setShowProfileDropdown(false)}
                            onChangePasswordClick={() => { setShowProfileDropdown(false); setShowChangePasswordModal(true); }}
                          />
                        )}
                      </div>
                    </nav>
                  </div>

                  {/* ── MOBILE layout: centered search | bell + avatar on right ── */}
                  <div className="flex md:hidden flex-1 items-center justify-center px-3">
                    <div style={{ flex: 1, maxWidth: 260 }}>
                      <SearchComponent />
                    </div>
                  </div>
                  <div className="flex md:hidden items-center gap-0.5">
                    {/* Bell */}
                    <div className="relative" ref={notificationsRef}>
                      <Button variant="ghost" size="icon" className="relative rounded-full" onClick={() => setShowNotifications(p => !p)}>
                        <Bell className="w-6 h-6" />
                        {hasUnread && <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />}
                      </Button>
                      {showNotifications && <NotificationsPopover onClose={() => setShowNotifications(false)} onNotificationsRead={checkAllUnreadStatus} />}
                    </div>
                    {/* Avatar — mobile header, opens dropdown downward */}
                    <div className="relative" ref={profileDropdownRef}>
                      <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setShowProfileDropdown(p => !p)}>
                        <img src={currentUser.avatar} alt="profile" className="w-8 h-8 rounded-full object-cover" />
                      </Button>
                      {showProfileDropdown && (
                        <ProfileDropdown
                          user={currentUser}
                          onSignOut={handleSignOut}
                          onNavigate={() => setShowProfileDropdown(false)}
                          onChangePasswordClick={() => { setShowProfileDropdown(false); setShowChangePasswordModal(true); }}
                        />
                      )}
                    </div>
                    {currentUser?.is_admin && (
                      <Link to="/admin">
                        <Button variant="ghost" size="icon" className="rounded-full" title="Admin Dashboard">
                          <Shield className="w-5 h-5 text-purple-600" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </>
              ) : (
                /* ── Public nav: context-aware per route ── */
                <nav className="flex items-center gap-5">
                  {/* "/" shows Gallery link only. "/gallery" shows Home link only. */}
                  {location.pathname === "/" && (
                    <Link to="/gallery" className="text-sm font-medium text-gray-600 hover:text-purple-600 transition-colors">
                      Gallery
                    </Link>
                  )}
                  {location.pathname === "/gallery" && (
                    <Link to="/" className="text-sm font-medium text-gray-600 hover:text-purple-600 transition-colors">
                      Home
                    </Link>
                  )}
                  <Link to="/login" className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
                    Log In
                  </Link>
                  <Link to="/sign-up">
                    <Button className="bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-full px-6">
                      Sign Up
                    </Button>
                  </Link>
                </nav>
              )}
            </div>
          </div>
        </header>
      )}

      <main>{shouldIntercept ? <AuthCallback /> : <Outlet />}</main>

      {!isAuthPage && !currentUser && <Footer />}
      {!isAuthPage && currentUser && (
        <MobileNavFooter
          hasUnreadMessages={hasUnreadMessages}
          onMessagesClick={handleMarkMessagesRead}
          onChangePasswordClick={() => setShowChangePasswordModal(true)}
          onSignOut={handleSignOut}
        />
      )}

      {showChangePasswordModal && <ChangePasswordModal onClose={() => setShowChangePasswordModal(false)} />}
      <SupabaseDebug />
    </div>
  );
}
