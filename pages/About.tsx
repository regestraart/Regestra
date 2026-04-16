import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, Sparkles, Users, Palette, Upload, Grid, Search,
  Clock, ShieldCheck, Compass, Globe,
  MessageCircle, TrendingUp, ChevronDown, Check, Zap,
} from "lucide-react";
import { Button } from "../components/ui/Button";

/* ────────────────────────────────────────────────────────────────────────────
   DESIGN TOKENS
   ────────────────────────────────────────────────────────────────────────── */
const P   = "#7c3aed";
const P2  = "#6d28d9";
const P3  = "#5b21b6";
const T   = "#0d9488";
const T2  = "#0f766e";
const LP  = "#f5f3ff";
const LT  = "#f0fdfa";
const LP2 = "#ede9fe";

/* ────────────────────────────────────────────────────────────────────────────
   SHARED HELPERS
   ────────────────────────────────────────────────────────────────────────── */
const Badge = ({ children, teal = false }: { children: React.ReactNode; teal?: boolean }) => (
  <span style={{
    display: "inline-block",
    background: teal ? "rgba(13,148,136,0.15)" : "rgba(124,58,237,0.12)",
    color: teal ? T : P,
    borderRadius: 999, padding: "4px 14px",
    fontSize: 11, fontWeight: 700, letterSpacing: "0.07em",
    textTransform: "uppercase" as const,
    border: `1px solid ${teal ? "rgba(13,148,136,0.25)" : "rgba(124,58,237,0.2)"}`,
  }}>{children}</span>
);

/* Blob: decorative radial glow used across sections */
const Blob = ({ x, y, color, size = 400, opacity = 0.18 }: {
  x: string; y: string; color: string; size?: number; opacity?: number;
}) => (
  <div style={{
    position: "absolute",
    left: x, top: y,
    width: size, height: size,
    borderRadius: "50%",
    background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
    opacity,
    pointerEvents: "none",
    transform: "translate(-50%, -50%)",
    filter: "blur(1px)",
  }} />
);

/* Hover lift card wrapper */
function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{ transition: "transform 0.22s, box-shadow 0.22s", ...style }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-6px)";
        e.currentTarget.style.boxShadow = "0 20px 48px rgba(124,58,237,0.18)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = (style as any).boxShadow || "0 2px 16px rgba(0,0,0,0.07)";
      }}
    >
      {children}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   1. HERO  ── rich purple gradient + teal glow + decorative shapes
   ────────────────────────────────────────────────────────────────────────── */
function Hero() {
  return (
    <section style={{
      position: "relative", overflow: "hidden",
      background: `linear-gradient(145deg, ${P3} 0%, ${P2} 30%, ${P} 60%, ${T} 100%)`,
      color: "#fff",
      paddingBottom: 0,
    }}>
      {/* Decorative blobs */}
      <Blob x="10%"  y="30%" color={T}   size={600} opacity={0.22} />
      <Blob x="90%"  y="15%" color={P3}  size={500} opacity={0.35} />
      <Blob x="55%"  y="80%" color={T2}  size={400} opacity={0.18} />

      {/* Fine dot grid overlay */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: "radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      }} />

      <div style={{
        position: "relative",
        maxWidth: 1100, margin: "0 auto",
        padding: "104px 24px 96px",
        textAlign: "center",
      }}>
        {/* Pill */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "rgba(255,255,255,0.14)", backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.22)",
          borderRadius: 999, padding: "7px 20px", marginBottom: 36,
          fontSize: 13, fontWeight: 600, letterSpacing: "0.04em",
        }}>
          <Sparkles style={{ width: 14, height: 14 }} />
          The platform for your art
        </div>

        <h1 style={{
          fontSize: "clamp(2.8rem, 7vw, 5rem)", fontWeight: 900,
          letterSpacing: "0.01em", lineHeight: 1.05, marginBottom: 28,
          textShadow: "0 2px 40px rgba(0,0,0,0.2)",
        }}>
          Showcase Your<br />Creative Vision
        </h1>

        <p style={{
          fontSize: "clamp(1rem, 2.5vw, 1.22rem)",
          color: "rgba(255,255,255,0.88)", maxWidth: 560,
          margin: "0 auto 48px", lineHeight: 1.82,
        }}>
          Join thousands of artists and art lovers sharing their work,
          building their portfolio, and connecting with a vibrant creative community.
        </p>

        <Link to="/sign-up">
          <Button size="xl" variant="primary-light" style={{
            borderRadius: 999, fontWeight: 700,
            boxShadow: "0 8px 32px rgba(0,0,0,0.28)",
            fontSize: "1rem",
          }}>
            Get Started Free
            <ArrowRight style={{ marginLeft: 8, width: 18, height: 18 }} />
          </Button>
        </Link>

        {/* Floating stat chips */}
        <div style={{
          display: "flex", gap: 14, justifyContent: "center",
          flexWrap: "wrap", marginTop: 56,
        }}>
          {[
            { icon: <Palette style={{ width: 14, height: 14 }} />, text: "Artist portfolios" },
            { icon: <Search  style={{ width: 14, height: 14 }} />, text: "Social discovery" },
            { icon: <Globe   style={{ width: 14, height: 14 }} />, text: "Global community" },
          ].map(c => (
            <div key={c.text} style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              background: "rgba(255,255,255,0.13)", backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 999, padding: "6px 16px",
              fontSize: 13, fontWeight: 500,
            }}>
              {c.icon} {c.text}
            </div>
          ))}
        </div>
      </div>

      {/* Smooth wave into next section */}
      <div style={{ position: "relative", lineHeight: 0, marginBottom: -1 }}>
        <svg viewBox="0 0 1440 100" fill="none" style={{ display: "block", width: "100%" }}>
          <path d="M0 100V40C240 80 480 0 720 30C960 60 1200 10 1440 40V100Z" fill="#1e1b4b" fillOpacity="0.06" />
          <path d="M0 100V60C240 90 480 20 720 50C960 80 1200 30 1440 60V100Z" fill="white" />
        </svg>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   2. WHAT IS REGESTRA  ── deep purple band, white cards floating above
   ────────────────────────────────────────────────────────────────────────── */
function WhatIsRegestra() {
  const cards = [
    {
      icon: <Palette style={{ width: 28, height: 28, color: "#fff" }} />,
      iconBg: P,
      title: "Beautiful Portfolios",
      body: "Every artist gets a living portfolio that grows with their practice. A professional home for their entire body of work, shareable and always up to date.",
    },
    {
      icon: <Users style={{ width: 28, height: 28, color: "#fff" }} />,
      iconBg: T,
      title: "Connect and Share",
      body: "Follow the artists you admire, build your own audience, and engage with a community of creators who genuinely care about art.",
    },
    {
      icon: <Sparkles style={{ width: 28, height: 28, color: "#fff" }} />,
      iconBg: P,
      title: "Easy Publishing",
      body: "Upload and share your artwork in seconds. No technical skills required. Just your art and the story behind it.",
    },
  ];

  return (
    <section style={{
      position: "relative", overflow: "hidden",
      background: `linear-gradient(155deg, ${P3} 0%, ${P2} 50%, #1e1b4b 100%)`,
      padding: "96px 24px 80px",
      color: "#fff",
    }}>
      <Blob x="80%" y="20%" color={T}  size={500} opacity={0.14} />
      <Blob x="5%"  y="70%" color={P}  size={400} opacity={0.22} />

      <div style={{ position: "relative", maxWidth: 1080, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <h2 style={{
            fontSize: "clamp(1.9rem, 4vw, 3rem)", fontWeight: 900,
            marginBottom: 20, lineHeight: 1.1,
            textShadow: "0 2px 20px rgba(0,0,0,0.15)",
          }}>
            Authentic Art.{" "}
            <span style={{
              background: `linear-gradient(90deg, #a5f3fc, ${T} 40%, #67e8f9)`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              Trusted Connections.
            </span>
          </h2>
          <p style={{
            fontSize: "1.1rem", color: "rgba(255,255,255,0.8)",
            maxWidth: 620, margin: "0 auto", lineHeight: 1.82,
          }}>
            Regestra is a social platform built for artists and art lovers. We bring together
            discovery, community, and commerce in a single space so artists get the visibility
            they deserve and art lovers find work they can trust.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
          {cards.map((c, i) => (
            <Card
              key={c.title}
              style={{
                background: "rgba(255,255,255,0.97)",
                borderRadius: 20, padding: "36px 30px",
                boxShadow: "0 4px 32px rgba(0,0,0,0.18)",
                border: "1px solid rgba(255,255,255,0.6)",
              }}
            >
              <div style={{
                width: 58, height: 58, borderRadius: 16,
                background: i === 1
                  ? `linear-gradient(135deg, ${T}, ${T2})`
                  : `linear-gradient(135deg, ${P}, ${P2})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 22,
                boxShadow: i === 1 ? `0 6px 20px ${T}44` : `0 6px 20px ${P}44`,
              }}>
                {c.icon}
              </div>
              <h3 style={{ fontSize: "1.12rem", fontWeight: 800, color: "#1a1a2e", marginBottom: 12 }}>{c.title}</h3>
              <p style={{ fontSize: "0.93rem", color: "#4b5563", lineHeight: 1.78 }}>{c.body}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Wave into next section */}
      <div style={{ position: "relative", lineHeight: 0, marginTop: 80, marginBottom: -1 }}>
        <svg viewBox="0 0 1440 80" fill="none" style={{ display: "block", width: "100%" }}>
          <path d="M0 80V30C360 70 720 0 1080 40C1260 60 1380 20 1440 30V80Z" fill={LP} fillOpacity="0.6" />
          <path d="M0 80V50C360 80 720 20 1080 60C1260 72 1380 45 1440 55V80Z" fill="white" />
        </svg>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   3. ARTIST FIRST  ── light purple tinted panel with strong card grid
   ────────────────────────────────────────────────────────────────────────── */
function ArtistFirst() {
  const pillars = [
    { value: "Artists",   label: "Professional portfolios for every creator, at every career stage", icon: <Palette style={{ width: 18, height: 18, color: P }} /> },
    { value: "Discovery", label: "Follow, search, and recommendations without gatekeeping",          icon: <Search  style={{ width: 18, height: 18, color: T }} /> },
    { value: "Community", label: "Real relationships between artists and art lovers",                icon: <Users   style={{ width: 18, height: 18, color: P }} /> },
    { value: "Commerce",  label: "Buy and sell features built directly into the platform",           icon: <Globe   style={{ width: 18, height: 18, color: T }} /> },
  ];

  return (
    <section style={{
      position: "relative", overflow: "hidden",
      background: `linear-gradient(160deg, #faf8ff 0%, ${LP2} 40%, #f0f9ff 100%)`,
      padding: "96px 24px",
    }}>
      {/* Soft purple glow top right */}
      <div style={{
        position: "absolute", top: -80, right: -80, width: 500, height: 500,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${LP2} 0%, transparent 70%)`,
        opacity: 0.9, pointerEvents: "none",
      }} />

      <div style={{
        position: "relative", maxWidth: 1080, margin: "0 auto",
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        gap: 64, alignItems: "center",
      }}>
        {/* Text column */}
        <div>
          <Badge teal>Artist First</Badge>
          <h2 style={{
            fontSize: "clamp(1.7rem, 3.5vw, 2.6rem)", fontWeight: 900,
            color: "#1a1a2e", margin: "20px 0 24px", lineHeight: 1.15,
            letterSpacing: "0.01em",
          }}>
            Built Around the Artist,<br />Not the Institution
          </h2>
          <p style={{ fontSize: "0.97rem", color: "#374151", lineHeight: 1.85, marginBottom: 18 }}>
            For too long, the tools that help artists establish credibility, manage their catalog, and
            reach art lovers have been locked behind gallery relationships or enterprise price tags.
            Regestra changes that.
          </p>
          <p style={{ fontSize: "0.97rem", color: "#374151", lineHeight: 1.85, marginBottom: 18 }}>
            Every artist on Regestra, whether emerging or established, gets the same
            professional infrastructure previously reserved for the top of the market.
            A complete catalog of your work. A verified profile. A direct path to the
            people who are looking for exactly what you make.
          </p>
          <p style={{ fontSize: "0.97rem", color: "#374151", lineHeight: 1.85 }}>
            We believe art discovery should not require a gallery introduction. Social discovery,
            search, and recommendations mean your work finds its audience on its own merits.
          </p>
        </div>

        {/* Pillar cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {pillars.map((pl, i) => (
            <Card
              key={pl.value}
              style={{
                background: "#fff",
                borderRadius: 18, padding: "24px 20px",
                boxShadow: "0 2px 16px rgba(124,58,237,0.09)",
                border: `1px solid ${i % 2 === 0 ? "rgba(124,58,237,0.14)" : "rgba(13,148,136,0.14)"}`,
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 10, marginBottom: 14,
                background: i % 2 === 0 ? LP : LT,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {pl.icon}
              </div>
              <div style={{ fontSize: "0.98rem", fontWeight: 800, color: "#1a1a2e", marginBottom: 8 }}>{pl.value}</div>
              <div style={{ fontSize: "0.78rem", color: "#6b7280", lineHeight: 1.68 }}>{pl.label}</div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   4. HOW IT WORKS  ── teal tinted bg, prominent numbered cards
   ────────────────────────────────────────────────────────────────────────── */
function HowItWorks() {
  const steps = [
    {
      num: "01", icon: <Upload style={{ width: 22, height: 22, color: "#fff" }} />,
      title: "Upload Your Artwork",
      body: "Add images of your work along with title, medium, dimensions, and the story behind each piece. Your portfolio builds itself as you go.",
    },
    {
      num: "02", icon: <Grid style={{ width: 22, height: 22, color: "#fff" }} />,
      title: "Curate Your Gallery",
      body: "Arrange your work the way you want it seen. Whether you are an artist building a catalog or an art lover saving favourites, your space reflects your vision.",
    },
    {
      num: "03", icon: <Search style={{ width: 22, height: 22, color: "#fff" }} />,
      title: "Discover Artists",
      body: "Follow the artists you love. Explore recommended works, search by style or medium, and connect with a global community of creators and art lovers.",
    },
    {
      num: "04", icon: <Globe style={{ width: 22, height: 22, color: "#fff" }} />,
      title: "Reach Your Audience",
      body: "Share your work with people who are genuinely looking for it. Buy and sell features bring commerce directly to your portfolio with no intermediary required.",
    },
  ];

  return (
    <section style={{
      position: "relative", overflow: "hidden",
      background: `linear-gradient(155deg, #f0fdfa 0%, #ccfbf1 35%, #e0f2fe 100%)`,
      padding: "96px 24px",
    }}>
      {/* Teal glow */}
      <Blob x="15%" y="50%" color={T}  size={560} opacity={0.12} />
      <Blob x="85%" y="30%" color={P}  size={400} opacity={0.08} />

      {/* Subtle grid texture */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage:
          `linear-gradient(${T}18 1px, transparent 1px),` +
          `linear-gradient(90deg, ${T}18 1px, transparent 1px)`,
        backgroundSize: "48px 48px",
      }} />

      <div style={{ position: "relative", maxWidth: 1080, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <h2 style={{
            fontSize: "clamp(1.9rem, 4vw, 2.8rem)", fontWeight: 900,
            color: "#134e4a", marginBottom: 16, letterSpacing: "0.01em",
          }}>
            How It Works
          </h2>
          <p style={{ fontSize: "1.02rem", color: "#0f766e", maxWidth: 500, margin: "0 auto", lineHeight: 1.78 }}>
            From your first upload to finding an audience around the world. Here is your path on Regestra.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 }}>
          {steps.map((s, i) => (
            <Card
              key={s.num}
              style={{
                background: "rgba(255,255,255,0.92)", borderRadius: 20,
                padding: "36px 26px", position: "relative",
                boxShadow: "0 4px 24px rgba(13,148,136,0.1)",
                border: `1px solid rgba(13,148,136,0.15)`,
                backdropFilter: "blur(4px)",
              }}
            >
              {/* Ghost number */}
              <div style={{
                position: "absolute", top: 16, right: 20,
                fontSize: "3rem", fontWeight: 900, lineHeight: 1,
                color: i < 2 ? `${T}1a` : `${P}1a`,
                userSelect: "none",
              }}>{s.num}</div>

              {/* Icon */}
              <div style={{
                width: 52, height: 52, borderRadius: 14, marginBottom: 20,
                background: `linear-gradient(135deg, ${T}, ${T2})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: `0 6px 18px ${T}40`,
              }}>
                {s.icon}
              </div>

              {/* Step indicator line */}
              <div style={{
                width: 32, height: 3, borderRadius: 2, marginBottom: 16,
                background: `linear-gradient(90deg, ${T}, ${P})`,
              }} />

              <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "#134e4a", marginBottom: 10 }}>{s.title}</h3>
              <p style={{ fontSize: "0.87rem", color: "#374151", lineHeight: 1.78 }}>{s.body}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   5. FEATURES TABS  ── purple tinted container, rich panel
   ────────────────────────────────────────────────────────────────────────── */
const FEATURE_TABS = [
  {
    id: "portfolio", label: "Portfolio",
    heading: "Your Art, Professionally Presented",
    body: "Every artist on Regestra gets a living catalog that builds itself as they upload. Title, medium, dimensions, and provenance all in one place. Share your portfolio with a single link so galleries, press, and art lovers can explore your entire body of work at a glance.",
    bullets: ["Automatically generated artist catalog", "Shareable public permalink", "Works organized by collection or series", "Optimised image display with no distortion"],
    color: P, bg: LP,
  },
  {
    id: "discovery", label: "Discovery",
    heading: "Find Art You Will Love",
    body: "Regestra puts discovery first. Follow artists whose work resonates with you, explore curated recommendations, and search by style, medium, or mood. No algorithm gatekeeping. Just art and the people who make it.",
    bullets: ["Follow artists and get notified of new work", "Personalised recommendations", "Search by style, medium, or keyword", "Trending and featured collections"],
    color: T, bg: LT,
  },
  {
    id: "community", label: "Community",
    heading: "Art is More Fun Together",
    body: "Regestra is built around real relationships. Comment on work you love, send direct messages, and build meaningful connections with artists and fellow art lovers around the world. A creative network that feels nothing like social media.",
    bullets: ["Direct messaging", "Comments and engagement", "Artist spotlights and features", "A global community without the noise"],
    color: P, bg: LP,
  },
  {
    id: "marketplace", label: "Marketplace",
    heading: "Sell Directly to People Who Love Your Work",
    body: "Buy and sell through the platform with terms that favour artists. Regestra keeps commission low so artists earn more of what their work is worth and art lovers pay what the art deserves.",
    bullets: ["Primary sales directly from your portfolio", "Artist friendly commission rates", "Integrated into your existing profile", "Secure and straightforward transactions"],
    color: T, bg: LT,
  },
];

const TAB_ICONS: Record<string, React.ReactNode> = {
  portfolio:   <Palette       style={{ width: 15, height: 15 }} />,
  discovery:   <Compass       style={{ width: 15, height: 15 }} />,
  community:   <MessageCircle style={{ width: 15, height: 15 }} />,
  marketplace: <TrendingUp    style={{ width: 15, height: 15 }} />,
};

const PANEL_ICONS: Record<string, (color: string) => React.ReactNode> = {
  portfolio:   c => <Palette       style={{ width: 72, height: 72, color: c }} />,
  discovery:   c => <Compass       style={{ width: 72, height: 72, color: c }} />,
  community:   c => <MessageCircle style={{ width: 72, height: 72, color: c }} />,
  marketplace: c => <TrendingUp    style={{ width: 72, height: 72, color: c }} />,
};

function FeaturesTabbed() {
  const [active, setActive] = useState(0);
  const tab = FEATURE_TABS[active];

  return (
    <section style={{
      position: "relative", overflow: "hidden",
      background: `linear-gradient(160deg, #faf8ff 0%, #f3e8ff 50%, #faf8ff 100%)`,
      padding: "96px 24px",
    }}>
      <Blob x="90%" y="20%" color={P}  size={600} opacity={0.1} />
      <Blob x="10%" y="80%" color={T}  size={400} opacity={0.08} />

      <div style={{ position: "relative", maxWidth: 1080, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <h2 style={{
            fontSize: "clamp(1.9rem, 4vw, 2.8rem)", fontWeight: 900,
            color: "#1a1a2e", marginBottom: 16, letterSpacing: "0.01em",
          }}>
            Everything You Need
          </h2>
          <p style={{ fontSize: "1.02rem", color: "#4b5563", maxWidth: 500, margin: "0 auto", lineHeight: 1.78 }}>
            Professional tools designed specifically for artists and art lovers, all in one place.
          </p>
        </div>

        {/* Tab bar */}
        <div role="tablist" style={{
          display: "flex", gap: 8, justifyContent: "center",
          marginBottom: 40, flexWrap: "wrap",
        }}>
          {FEATURE_TABS.map((t, i) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={i === active}
              aria-controls={`tabpanel-${t.id}`}
              id={`tab-${t.id}`}
              onClick={() => setActive(i)}
              style={{
                display: "flex", alignItems: "center", gap: 7, padding: "10px 22px",
                borderRadius: 999,
                border: i === active ? `2px solid ${t.color}` : "2px solid transparent",
                background: i === active
                  ? (t.color === P ? `linear-gradient(135deg, ${LP}, ${LP2})` : LT)
                  : "#fff",
                color: i === active ? t.color : "#6b7280",
                fontWeight: i === active ? 700 : 500, fontSize: "0.88rem",
                cursor: "pointer", transition: "all 0.2s", outline: "none",
                boxShadow: i === active ? `0 2px 12px ${t.color}22` : "0 1px 4px rgba(0,0,0,0.06)",
              }}
              onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 3px ${t.color}33`; }}
              onBlur={e => { e.currentTarget.style.boxShadow = i === active ? `0 2px 12px ${t.color}22` : "0 1px 4px rgba(0,0,0,0.06)"; }}
            >
              {TAB_ICONS[t.id]}
              {t.label}
            </button>
          ))}
        </div>

        {/* Panel */}
        <div
          id={`tabpanel-${tab.id}`}
          role="tabpanel"
          aria-labelledby={`tab-${tab.id}`}
          style={{
            background: "#fff",
            borderRadius: 24, padding: "48px 44px",
            border: `1px solid ${tab.color}28`,
            boxShadow: `0 8px 48px ${tab.color}18, 0 2px 8px rgba(0,0,0,0.04)`,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 48, alignItems: "center",
          }}
        >
          <div>
            <div style={{
              width: 60, height: 60, borderRadius: 16, marginBottom: 24,
              background: tab.color === P
                ? `linear-gradient(135deg, ${P}, ${P2})`
                : `linear-gradient(135deg, ${T}, ${T2})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: `0 6px 20px ${tab.color}40`,
            }}>
              {React.cloneElement(TAB_ICONS[tab.id] as React.ReactElement<any>, {
                style: { width: 22, height: 22, color: "#fff" },
              })}
            </div>
            <h3 style={{ fontSize: "1.4rem", fontWeight: 900, color: "#1a1a2e", marginBottom: 16 }}>{tab.heading}</h3>
            <p style={{ fontSize: "0.95rem", color: "#374151", lineHeight: 1.82, marginBottom: 28 }}>{tab.body}</p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
              {tab.bullets.map(b => (
                <li key={b} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: "0.9rem", color: "#374151" }}>
                  <div style={{
                    flexShrink: 0, marginTop: 2,
                    width: 20, height: 20, borderRadius: "50%",
                    background: tab.color === P ? LP2 : LT,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Check style={{ width: 11, height: 11, color: tab.color }} />
                  </div>
                  {b}
                </li>
              ))}
            </ul>
          </div>

          {/* Decorative orb */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 220 }}>
            <div style={{
              position: "relative",
              width: 220, height: 220,
            }}>
              {/* Outer ring */}
              <div style={{
                position: "absolute", inset: 0, borderRadius: "50%",
                border: `2px solid ${tab.color}20`,
                background: `radial-gradient(circle at 35% 35%, ${tab.bg} 0%, white 65%)`,
                boxShadow: `0 0 80px ${tab.color}1a, inset 0 0 40px ${tab.color}08`,
              }} />
              {/* Inner icon */}
              <div style={{
                position: "absolute", inset: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                opacity: 0.35,
              }}>
                {PANEL_ICONS[tab.id](tab.color)}
              </div>
              {/* Accent ring */}
              <div style={{
                position: "absolute", top: -8, right: -8,
                width: 40, height: 40, borderRadius: "50%",
                background: `linear-gradient(135deg, ${tab.color}, ${tab.color === P ? T : P})`,
                opacity: 0.7,
              }} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   6. TIMELINE  ── dark purple band with teal/purple spine
   ────────────────────────────────────────────────────────────────────────── */
const TIMELINE = [
  { teal: true,  label: "Live Now",    title: "Artist Portfolios",
    body: "Upload, organize, and share your entire body of work. Build the professional portfolio your art deserves." },
  { teal: true,  label: "Live Now",    title: "Social Discovery",
    body: "Follow artists, explore new work, and connect with the creative community through search and recommendations." },
  { teal: true,  label: "Live Now",    title: "Direct Messaging",
    body: "Connect directly with artists you love. Real conversations between real people with no public noise required." },
  { teal: false, label: "Coming Soon", title: "Authentication Layer",
    body: "A verification layer that links each artwork to its creator, producing a permanent trustworthy record of authorship and provenance." },
  { teal: false, label: "Coming Soon", title: "Certificates of Authentication",
    body: "Artists will be able to issue official digital Certificates of Authentication, giving art lovers documented confidence in every piece they acquire." },
];

function ComingSoonTimeline() {
  return (
    <section style={{
      position: "relative", overflow: "hidden",
      background: `linear-gradient(150deg, #1e1b4b 0%, ${P3} 40%, #1e3a5f 100%)`,
      padding: "96px 24px",
      color: "#fff",
    }}>
      <Blob x="85%" y="15%" color={T}  size={500} opacity={0.14} />
      <Blob x="10%" y="75%" color={P}  size={400} opacity={0.2} />

      {/* Dot grid */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: "radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)",
        backgroundSize: "32px 32px",
      }} />

      <div style={{ position: "relative", maxWidth: 760, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <h2 style={{
            fontSize: "clamp(1.9rem, 4vw, 2.8rem)", fontWeight: 900,
            marginBottom: 16, textShadow: "0 2px 20px rgba(0,0,0,0.2)",
          }}>
            What We Are Building
          </h2>
          <p style={{ fontSize: "1.02rem", color: "rgba(255,255,255,0.75)", maxWidth: 500, margin: "0 auto", lineHeight: 1.78 }}>
            Regestra is live and growing. Here is where we are today and what is on the horizon.
          </p>
        </div>

        <div style={{ position: "relative", paddingLeft: 40 }}>
          {/* Spine */}
          <div style={{
            position: "absolute", left: 14, top: 0, bottom: 0, width: 2,
            background: `linear-gradient(180deg, ${T} 0%, ${T}99 50%, ${P}99 70%, ${P} 100%)`,
            borderRadius: 2,
          }} />

          {TIMELINE.map((item, i) => {
            const color = item.teal ? T : P;
            return (
              <div
                key={item.title}
                style={{ position: "relative", marginBottom: i < TIMELINE.length - 1 ? 28 : 0 }}
              >
                {/* Dot */}
                <div style={{
                  position: "absolute", left: -33, top: 22,
                  width: 24, height: 24, borderRadius: "50%", zIndex: 1,
                  background: item.teal ? T : "rgba(255,255,255,0.08)",
                  border: `2px solid ${color}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: `0 0 12px ${color}66`,
                }}>
                  {item.teal
                    ? <Check style={{ width: 11, height: 11, color: "#fff" }} />
                    : <div style={{ width: 8, height: 8, borderRadius: "50%", background: P }} />
                  }
                </div>

                {/* Card */}
                <div
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    backdropFilter: "blur(12px)",
                    borderRadius: 16, padding: "22px 26px",
                    border: `1px solid ${color}30`,
                    transition: "transform 0.2s, background 0.2s, box-shadow 0.2s",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = "translateX(6px)";
                    e.currentTarget.style.background = "rgba(255,255,255,0.12)";
                    e.currentTarget.style.boxShadow = `0 8px 32px ${color}28`;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = "translateX(0)";
                    e.currentTarget.style.background = "rgba(255,255,255,0.07)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <span style={{
                      display: "inline-block",
                      background: item.teal ? "rgba(13,148,136,0.25)" : "rgba(124,58,237,0.25)",
                      color: item.teal ? "#5eead4" : "#c4b5fd",
                      borderRadius: 999, padding: "3px 12px",
                      fontSize: 10, fontWeight: 700, letterSpacing: "0.07em",
                      textTransform: "uppercase" as const,
                      border: `1px solid ${item.teal ? "rgba(94,234,212,0.3)" : "rgba(196,181,253,0.3)"}`,
                    }}>{item.label}</span>
                    {!item.teal && (
                      <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#c4b5fd", fontWeight: 600 }}>
                        <Clock style={{ width: 11, height: 11 }} /> In Development
                      </span>
                    )}
                  </div>
                  <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "#fff", marginBottom: 6 }}>{item.title}</h3>
                  <p style={{ fontSize: "0.87rem", color: "rgba(255,255,255,0.7)", lineHeight: 1.75, margin: 0 }}>{item.body}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Wave out */}
      <div style={{ position: "relative", lineHeight: 0, marginTop: 80, marginBottom: -1 }}>
        <svg viewBox="0 0 1440 80" fill="none" style={{ display: "block", width: "100%" }}>
          <path d="M0 80V50C480 10 960 70 1440 30V80Z" fill="white" fillOpacity="0.06" />
          <path d="M0 80V60C480 30 960 80 1440 50V80Z" fill={LP} fillOpacity="0.5" />
          <path d="M0 80V70C480 50 960 90 1440 65V80Z" fill="white" />
        </svg>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   7. FAQ  ── light purple tinted bg, crisp white card container
   ────────────────────────────────────────────────────────────────────────── */
const FAQS = [
  { q: "Is Regestra free to join?",
    a: "Yes. Creating an account, uploading artwork, and building your portfolio are all free. Advanced features are available as the platform grows." },
  { q: "Who is Regestra for?",
    a: "Regestra is built for artists at every stage, from students and emerging creators to established professionals, and for anyone who loves art and wants a trusted place to discover and follow artists." },
  { q: "What is the Authentication Layer?",
    a: "The Authentication Layer is a planned feature that will allow artists to formally register their work and produce a permanent trustworthy record of authorship. It is currently in development." },
  { q: "What are Certificates of Authentication?",
    a: "Certificates of Authentication are official digital documents artists will be able to issue for their work, giving art lovers documented confidence in what they acquire. This feature is coming soon." },
  { q: "Can I sell my artwork on Regestra?",
    a: "Buy and sell features are built directly into the platform. Artist friendly commission rates keep more of every sale where it belongs, with the person who made the work." },
];

function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section style={{
      position: "relative", overflow: "hidden",
      background: `linear-gradient(160deg, #faf8ff 0%, ${LP2} 40%, #f0f9ff 100%)`,
      padding: "96px 24px",
    }}>
      <Blob x="85%" y="20%" color={P}  size={500} opacity={0.1} />
      <Blob x="10%" y="80%" color={T}  size={350} opacity={0.07} />

      <div style={{ position: "relative", maxWidth: 780, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <h2 style={{
            fontSize: "clamp(1.9rem, 4vw, 2.6rem)", fontWeight: 900,
            color: "#1a1a2e", marginBottom: 14, letterSpacing: "0.01em",
          }}>
            Common Questions
          </h2>
          <p style={{ fontSize: "1rem", color: "#4b5563", lineHeight: 1.75 }}>
            Everything you need to know about getting started with Regestra.
          </p>
        </div>

        {/* Card container */}
        <div style={{
          background: "#fff",
          borderRadius: 24, overflow: "hidden",
          boxShadow: "0 8px 48px rgba(124,58,237,0.1), 0 2px 8px rgba(0,0,0,0.04)",
          border: `1px solid rgba(124,58,237,0.12)`,
        }}>
          {FAQS.map((faq, i) => {
            const isOpen = open === i;
            const isLast = i === FAQS.length - 1;
            return (
              <div
                key={faq.q}
                style={{
                  borderBottom: isLast ? "none" : `1px solid rgba(124,58,237,0.08)`,
                  background: isOpen ? LP : "transparent",
                  transition: "background 0.2s",
                }}
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-panel-${i}`}
                  id={`faq-btn-${i}`}
                  style={{
                    width: "100%", display: "flex", alignItems: "center",
                    justifyContent: "space-between",
                    padding: "22px 28px", background: "transparent", border: "none",
                    cursor: "pointer", textAlign: "left", gap: 16, outline: "none",
                  }}
                  onFocus={e => { e.currentTarget.style.boxShadow = `inset 0 0 0 2px ${P}33`; }}
                  onBlur={e => { e.currentTarget.style.boxShadow = "none"; }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{
                      flexShrink: 0, width: 28, height: 28, borderRadius: 8,
                      background: isOpen ? P : LP2,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "background 0.2s",
                    }}>
                      <Zap style={{ width: 13, height: 13, color: isOpen ? "#fff" : P }} />
                    </div>
                    <span style={{ fontSize: "0.97rem", fontWeight: 600, color: isOpen ? P : "#1a1a2e" }}>{faq.q}</span>
                  </div>
                  <ChevronDown style={{
                    width: 18, height: 18, color: isOpen ? P : "#9ca3af", flexShrink: 0,
                    transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.24s ease",
                  }} />
                </button>

                {isOpen && (
                  <div
                    id={`faq-panel-${i}`}
                    role="region"
                    aria-labelledby={`faq-btn-${i}`}
                    style={{
                      padding: "0 28px 24px 70px",
                      fontSize: "0.92rem", color: "#374151", lineHeight: 1.82,
                    }}
                  >
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   8. CTA  ── full bleed gradient, prominent
   ────────────────────────────────────────────────────────────────────────── */
function CTA() {
  return (
    <section style={{
      position: "relative", overflow: "hidden",
      background: `linear-gradient(145deg, ${P3} 0%, ${P2} 30%, ${P} 65%, ${T} 100%)`,
      padding: "100px 24px",
      color: "#fff", textAlign: "center",
    }}>
      <Blob x="20%" y="30%" color={T}  size={600} opacity={0.18} />
      <Blob x="80%" y="70%" color={P3} size={500} opacity={0.25} />
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: "radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      }} />

      <div style={{ position: "relative", maxWidth: 700, margin: "0 auto" }}>
        <h2 style={{
          fontSize: "clamp(2rem, 5vw, 3.2rem)", fontWeight: 900,
          marginBottom: 22, lineHeight: 1.1,
          textShadow: "0 2px 32px rgba(0,0,0,0.2)",
        }}>
          Ready to Share Your Art?
        </h2>
        <p style={{
          fontSize: "1.1rem", color: "rgba(255,255,255,0.85)",
          marginBottom: 44, lineHeight: 1.8,
        }}>
          Join thousands of artists and art lovers who trust Regestra to showcase their creative work.
        </p>
        <Link to="/sign-up">
          <Button size="xl" variant="primary-light" style={{
            borderRadius: 999, fontWeight: 800,
            boxShadow: "0 8px 40px rgba(0,0,0,0.28)",
            fontSize: "1rem", padding: "16px 40px",
          }}>
            Get Started Free
            <ArrowRight style={{ marginLeft: 10, width: 18, height: 18 }} />
          </Button>
        </Link>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   PAGE
   ────────────────────────────────────────────────────────────────────────── */
export default function About() {
  return (
    <div style={{ overflowX: "hidden" }}>
      <Hero />
      <WhatIsRegestra />
      <ArtistFirst />
      <HowItWorks />
      <FeaturesTabbed />
      <ComingSoonTimeline />
      <FAQ />
      <CTA />
    </div>
  );
}
