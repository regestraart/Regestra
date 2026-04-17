import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, ShoppingBag, Award, Upload, MessageCircle } from "lucide-react";

const P = "#7c3aed";
const T = "#0d9488";

interface MobileNavFooterProps {
  hasUnreadMessages: boolean;
  onMessagesClick?: () => void;
  onChangePasswordClick?: () => void;
  onSignOut?: () => void;
}

// Order: Home, Market, Upload (centered/highlight), Verify, Chat
const NAV_ITEMS = [
  { to: "/",             icon: Home,          label: "Home" },
  { to: "/marketplace",  icon: ShoppingBag,   label: "Market" },
  { to: "/upload",       icon: Upload,        label: "Upload",   highlight: true },
  { to: "/verify",       icon: Award,         label: "Verify" },
  { to: "/messages",     icon: MessageCircle, label: "Chat",     isMessages: true },
];

export default function MobileNavFooter({
  hasUnreadMessages,
  onMessagesClick,
  onChangePasswordClick,
  onSignOut,
}: MobileNavFooterProps) {
  const location = useLocation();

  return (
    <>
      <div className="mobile-nav-footer-spacer" />

      <nav
        className="mobile-nav-footer"
        style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50, display: "none" }}
      >
        {/* Gradient top border */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 1,
          background: `linear-gradient(90deg, transparent, ${P}55, ${T}55, transparent)`,
        }} />

        {/* Footer bar */}
        <div style={{
          background: "rgba(255,255,255,0.96)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-around",
            height: 70, padding: "0 4px",
          }}>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                location.pathname === item.to ||
                (item.to === "/verify" && location.pathname.startsWith("/verify")) ||
                (item.to === "/" && location.pathname === "/");
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
                      width: 54, height: 54, borderRadius: 18,
                      background: `linear-gradient(135deg, ${P}, ${T})`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: `0 4px 16px ${P}40`,
                    }}>
                      <Icon size={24} color="#fff" strokeWidth={2.4} />
                    </div>
                    <span style={{ fontSize: "0.68rem", fontWeight: 800, color: P, letterSpacing: "0.02em" }}>
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
                      width: 44, height: 44, borderRadius: 14,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: isActive ? `${P}12` : "transparent",
                    }}>
                      <Icon size={24} color={isActive ? P : "#9ca3af"} strokeWidth={isActive ? 2.6 : 2} />
                    </div>
                    {showUnread && (
                      <span style={{
                        position: "absolute", top: 6, right: 6, width: 8, height: 8,
                        borderRadius: "50%", background: "#ef4444", border: "2px solid #fff",
                      }} />
                    )}
                  </div>
                  <span style={{
                    fontSize: "0.68rem", fontWeight: isActive ? 800 : 600,
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
          </div>
        </div>
      </nav>
    </>
  );
}
