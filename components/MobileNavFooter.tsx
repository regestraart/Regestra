import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ShoppingBag, Award, Upload, MessageCircle, User, LogOut, Lock, CreditCard } from "lucide-react";
import { useUser } from "../context/UserContext";
import { createUrl } from "../utils";

const P = "#7c3aed";
const T = "#0d9488";

interface MobileNavFooterProps {
  hasUnreadMessages: boolean;
  onMessagesClick?: () => void;
  onChangePasswordClick?: () => void;
  onSignOut?: () => void;
}

const NAV_ITEMS = [
  { to: "/marketplace", icon: ShoppingBag, label: "Market" },
  { to: "/verify",      icon: Award,       label: "Verify" },
  { to: "/upload",      icon: Upload,       label: "Upload", highlight: true },
  { to: "/messages",    icon: MessageCircle, label: "Chat",  isMessages: true },
];

export default function MobileNavFooter({
  hasUnreadMessages,
  onMessagesClick,
  onChangePasswordClick,
  onSignOut,
}: MobileNavFooterProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useUser();
  const [dropUpOpen, setDropUpOpen] = useState(false);
  const footerRef = useRef<HTMLDivElement>(null);

  // Close drop-up when clicking outside
  useEffect(() => {
    if (!dropUpOpen) return;
    const handler = (e: MouseEvent) => {
      if (footerRef.current && !footerRef.current.contains(e.target as Node)) {
        setDropUpOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [dropUpOpen]);

  // Close drop-up on route change
  useEffect(() => { setDropUpOpen(false); }, [location.pathname]);

  const handleSignOut = () => {
    setDropUpOpen(false);
    onSignOut?.();
  };

  const handleChangePassword = () => {
    setDropUpOpen(false);
    onChangePasswordClick?.();
  };

  const handleNav = (path: string) => {
    setDropUpOpen(false);
    navigate(path);
  };

  return (
    <>
      <div className="mobile-nav-footer-spacer" />

      <nav
        ref={footerRef}
        className="mobile-nav-footer"
        style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50, display: "none" }}
      >
        {/* Gradient top border */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 1,
          background: `linear-gradient(90deg, transparent, ${P}55, ${T}55, transparent)`,
        }} />

        {/* Drop-up menu */}
        {dropUpOpen && currentUser && (
          <div style={{
            position: "absolute",
            bottom: "100%",
            right: 0,
            marginBottom: 8,
            width: 220,
            background: "#fff",
            borderRadius: 16,
            boxShadow: "0 -4px 32px rgba(0,0,0,0.13), 0 2px 8px rgba(0,0,0,0.07)",
            border: "1px solid rgba(0,0,0,0.07)",
            overflow: "hidden",
            zIndex: 60,
          }}>
            {/* User info header */}
            <div style={{ padding: "12px 16px", borderBottom: "1px solid #f3f4f6" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <img
                  src={currentUser.avatar}
                  alt="profile"
                  style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                />
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: "0.85rem", fontWeight: 700, color: "#111", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {currentUser.name}
                  </p>
                  <p style={{ fontSize: "0.72rem", color: "#9ca3af", margin: 0 }}>@{currentUser.username}</p>
                </div>
              </div>
            </div>

            {/* Menu items */}
            {([
              { label: "View Profile",     icon: <User size={17} color="#9ca3af" />,  path: createUrl("/profile/:username", { username: currentUser.username }) },
              { label: "Regestra Wallet",  icon: <Award size={17} color={P} />,       path: "/wallet" },
              { label: "Subscription",     icon: <CreditCard size={17} color="#9ca3af" />, path: "/subscription" },
            ] as { label: string; icon: React.ReactNode; path: string }[]).map((item) => (
              <button
                key={item.label}
                onClick={() => handleNav(item.path)}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  width: "100%", padding: "11px 16px", background: "none",
                  border: "none", cursor: "pointer", textAlign: "left",
                  fontSize: "0.875rem", fontWeight: 600, color: "#374151",
                }}
              >
                {item.icon}
                {item.label}
              </button>
            ))}

            <button
              onClick={handleChangePassword}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                width: "100%", padding: "11px 16px", background: "none",
                border: "none", cursor: "pointer", textAlign: "left",
                fontSize: "0.875rem", fontWeight: 600, color: "#374151",
              }}
            >
              <Lock size={17} color="#9ca3af" />
              Change Password
            </button>

            <div style={{ height: 1, background: "#f3f4f6", margin: "2px 12px" }} />

            <button
              onClick={handleSignOut}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                width: "100%", padding: "11px 16px", background: "none",
                border: "none", cursor: "pointer", textAlign: "left",
                fontSize: "0.875rem", fontWeight: 600, color: "#ef4444",
              }}
            >
              <LogOut size={17} color="#ef4444" />
              Sign Out
            </button>
          </div>
        )}

        {/* Footer bar */}
        <div style={{
          background: "rgba(255,255,255,0.96)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-around",
            height: 62, padding: "0 4px",
          }}>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to ||
                (item.to === "/verify" && location.pathname.startsWith("/verify"));
              const showUnread = item.isMessages && hasUnreadMessages;

              if (item.highlight) {
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    style={{
                      display: "flex", flexDirection: "column", alignItems: "center",
                      justifyContent: "center", gap: 3, textDecoration: "none", flex: 1,
                    }}
                  >
                    <div style={{
                      width: 48, height: 48, borderRadius: 16,
                      background: `linear-gradient(135deg, ${P}, ${T})`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: `0 4px 16px ${P}40`,
                    }}>
                      <Icon size={20} color="#fff" strokeWidth={2.2} />
                    </div>
                    <span style={{ fontSize: "0.6rem", fontWeight: 700, color: P, letterSpacing: "0.02em" }}>
                      {item.label}
                    </span>
                  </Link>
                );
              }

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={item.isMessages ? onMessagesClick : undefined}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center",
                    justifyContent: "center", gap: 3, textDecoration: "none",
                    flex: 1, position: "relative",
                  }}
                >
                  <div style={{ position: "relative" }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 12,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: isActive ? `${P}12` : "transparent",
                    }}>
                      <Icon size={20} color={isActive ? P : "#9ca3af"} strokeWidth={isActive ? 2.4 : 1.8} />
                    </div>
                    {showUnread && (
                      <span style={{
                        position: "absolute", top: 6, right: 6, width: 8, height: 8,
                        borderRadius: "50%", background: "#ef4444", border: "2px solid #fff",
                      }} />
                    )}
                  </div>
                  <span style={{
                    fontSize: "0.6rem", fontWeight: isActive ? 700 : 500,
                    color: isActive ? P : "#9ca3af", letterSpacing: "0.02em",
                  }}>
                    {item.label}
                  </span>
                  {isActive && (
                    <div style={{
                      position: "absolute", bottom: -2, width: 4, height: 4,
                      borderRadius: "50%", background: `linear-gradient(135deg, ${P}, ${T})`,
                    }} />
                  )}
                </Link>
              );
            })}

            {/* Profile avatar — 5th item, opens drop-up */}
            <div
              style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", gap: 3, flex: 1, cursor: "pointer",
              }}
              onClick={() => setDropUpOpen(p => !p)}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: dropUpOpen ? `${P}12` : "transparent",
              }}>
                {currentUser ? (
                  <img
                    src={currentUser.avatar}
                    alt="profile"
                    style={{
                      width: 28, height: 28, borderRadius: "50%", objectFit: "cover",
                      border: dropUpOpen ? `2px solid ${P}` : "2px solid transparent",
                    }}
                  />
                ) : (
                  <User size={20} color="#9ca3af" strokeWidth={1.8} />
                )}
              </div>
              <span style={{
                fontSize: "0.6rem", fontWeight: dropUpOpen ? 700 : 500,
                color: dropUpOpen ? P : "#9ca3af", letterSpacing: "0.02em",
              }}>
                Profile
              </span>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
