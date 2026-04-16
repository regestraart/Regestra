import React, { useState } from "react";
import { useUser } from "../context/UserContext";
import SocialFeed from "../components/SocialFeed";
import { Link } from "react-router-dom";
import {
  ArrowRight, Sparkles, Palette, Upload, Grid, Search,
  Clock, Globe, MessageCircle, TrendingUp, ChevronDown,
  Check, Users, Compass, Zap, ShoppingBag,
} from "lucide-react";
import { Button } from "../components/ui/Button";

/* ── tokens ─────────────────────────────────────────────────────────────── */
const P  = "#7c3aed";
const P2 = "#6d28d9";
const P3 = "#5b21b6";
const T  = "#0d9488";
const T2 = "#0f766e";
const LP = "#f5f3ff";
const LT = "#f0fdfa";

/* ── shared helpers ─────────────────────────────────────────────────────── */
const Badge = ({ children, teal = false }: { children: React.ReactNode; teal?: boolean }) => (
  <span style={{
    display: "inline-block",
    background: teal ? "rgba(13,148,136,0.12)" : "rgba(124,58,237,0.1)",
    color: teal ? T : P,
    border: `1px solid ${teal ? "rgba(13,148,136,0.22)" : "rgba(124,58,237,0.18)"}`,
    borderRadius: 999, padding: "4px 14px",
    fontSize: 11, fontWeight: 700, letterSpacing: "0.07em",
    textTransform: "uppercase" as const,
  }}>{children}</span>
);

function HoverCard({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{ transition: "transform 0.22s, box-shadow 0.22s", ...style }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.boxShadow = "0 24px 56px rgba(124,58,237,0.18)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = (style as any).boxShadow || "0 2px 16px rgba(0,0,0,0.07)"; }}
    >
      {children}
    </div>
  );
}

/* ── 1. HERO ─────────────────────────────────────────────────────────────── */
function Hero() {
  return (
    <section style={{
      position: "relative", overflow: "hidden",
      background: `linear-gradient(145deg, ${P3} 0%, ${P2} 35%, ${P} 65%, ${T} 100%)`,
      color: "#fff",
    }}>
      {/* Radial glows */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage:
          `radial-gradient(ellipse at 12% 55%, ${T}30 0%, transparent 50%),` +
          `radial-gradient(ellipse at 88% 15%, ${P3}55 0%, transparent 48%),` +
          `radial-gradient(ellipse at 55% 90%, ${T2}25 0%, transparent 45%)`,
      }} />
      {/* Dot grid */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: "radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      }} />

      <div style={{ position: "relative", maxWidth: 1100, margin: "0 auto", padding: "112px 24px 108px", textAlign: "center" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "rgba(255,255,255,0.13)", backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.2)",
          borderRadius: 999, padding: "7px 20px", marginBottom: 36,
          fontSize: 13, fontWeight: 600, letterSpacing: "0.04em",
        }}>
          <Sparkles style={{ width: 14, height: 14 }} />
          Where Art Finds Its Audience
        </div>

        <h1 className="rg-display rg-hero-glow" style={{ marginBottom: 28, color: "#fff" }}>
          Art That Connects.<br />
          <span className="rg-grad-text-teal">People Who Care.</span>
        </h1>

        <p style={{
          fontSize: "clamp(1rem, 2.5vw, 1.18rem)", fontWeight: 400,
          color: "rgba(255,255,255,0.84)", maxWidth: 520,
          margin: "0 auto 52px", lineHeight: 1.82,
          letterSpacing: "0.005em",
        }}>
          Whether you create it or collect it, Regestra is built for you.
          Share your work, discover emerging artists, and connect with a
          community that genuinely cares about art.
        </p>

        {/* CTA row */}
        <div style={{
          display: "flex", flexWrap: "wrap",
          gap: 16, justifyContent: "center", alignItems: "center",
          padding: "0 16px",
        }}>
          <Link to="/sign-up">
            <Button size="xl" variant="primary-light" style={{
              borderRadius: 999, fontWeight: 800,
              boxShadow: "0 8px 40px rgba(0,0,0,0.28)", fontSize: "1rem",
            }}>
              Get Started Free
              <ArrowRight style={{ marginLeft: 8, width: 18, height: 18 }} />
            </Button>
          </Link>

          <Link to="/gallery" style={{ textDecoration: "none" }}>
            <button
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "14px 28px", borderRadius: 999,
                fontSize: "1rem", fontWeight: 700,
                color: "#fff",
                background: "rgba(255,255,255,0.08)",
                border: "1.5px solid rgba(255,255,255,0.55)",
                cursor: "pointer",
                backdropFilter: "blur(6px)",
                boxShadow: "0 2px 12px rgba(0,0,0,0.12)",
                transition: "background 200ms ease, border-color 200ms ease, box-shadow 200ms ease",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = "rgba(255,255,255,0.18)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.8)";
                e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.18)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.55)";
                e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.12)";
              }}
            >
              View Gallery
            </button>
          </Link>
        </div>

        {/* Floating chips */}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 56 }}>
          {[
            { icon: <Palette      style={{ width: 13, height: 13 }} />, text: "Artist portfolios" },
            { icon: <Search       style={{ width: 13, height: 13 }} />, text: "Social discovery"  },
            { icon: <Globe        style={{ width: 13, height: 13 }} />, text: "Global community"  },
            { icon: <ShoppingBag  style={{ width: 13, height: 13 }} />, text: "Marketplace"       },
          ].map(c => (
            <div key={c.text} style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.18)",
              borderRadius: 999, padding: "6px 16px", fontSize: 12, fontWeight: 500,
            }}>
              {c.icon}{c.text}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── 2. VALUE BAND  ── deep purple, white cards ──────────────────────────── */
function ValueBand() {
  const cards = [
    {
      icon: <Palette style={{ width: 26, height: 26, color: "#fff" }} />,
      iconGrad: `linear-gradient(135deg, ${P}, ${P2})`,
      iconShadow: `0 6px 20px ${P}55`,
      title: "Living Portfolios",
      body: "Artists get a complete, auto-updating catalog. Art lovers get a curated feed of work that matches their taste. One platform, built for both.",
    },
    {
      icon: <Users style={{ width: 26, height: 26, color: "#fff" }} />,
      iconGrad: `linear-gradient(135deg, ${T}, ${T2})`,
      iconShadow: `0 6px 20px ${T}55`,
      title: "Real Connections",
      body: "Follow artists you love, build your audience, and engage with collectors and creators who genuinely care about art — not just content.",
    },
    {
      icon: <Globe style={{ width: 26, height: 26, color: "#fff" }} />,
      iconGrad: `linear-gradient(135deg, ${P}, ${T})`,
      iconShadow: `0 6px 20px ${P}44`,
      title: "Direct Commerce",
      body: "Artists list their work, collectors browse and buy. Message sellers directly to arrange a purchase. On-platform checkout coming soon.",
    },
  ];

  return (
    <section style={{
      position: "relative", overflow: "hidden",
      background: `linear-gradient(155deg, ${P3} 0%, ${P2} 45%, #1e1b4b 100%)`,
      padding: "96px 24px",
    }}>
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage:
          `radial-gradient(ellipse at 80% 20%, ${T}22 0%, transparent 50%),` +
          `radial-gradient(ellipse at 10% 70%, ${P}30 0%, transparent 50%)`,
      }} />

      <div style={{ position: "relative", maxWidth: 1080, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <h2 className="rg-h2 rg-hero-glow-dark" style={{ color: "#fff", marginBottom: 18 }}>
            Authentic Art.{" "}
            <span className="rg-grad-text-teal">Trusted Connections.</span>
          </h2>
          <p className="rg-body-lg" style={{ color: "rgba(255,255,255,0.76)", maxWidth: 560, margin: "0 auto" }}>
            Regestra brings together artists and art lovers in one space —
            where creators get the visibility they deserve and collectors
            find work they truly love.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
          {cards.map(c => (
            <HoverCard key={c.title} style={{
              background: "rgba(255,255,255,0.96)",
              borderRadius: 20, padding: "36px 30px",
              boxShadow: "0 4px 32px rgba(0,0,0,0.2)",
            }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: c.iconGrad, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 22, boxShadow: c.iconShadow }}>{c.icon}</div>
              <h3 className="rg-h3" style={{ color: "#1a1a2e", marginBottom: 12 }}>{c.title}</h3>
              <p className="rg-body" style={{ color: "#4b5563" }}>{c.body}</p>
            </HoverCard>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── 3. ARTIST FIRST  ── light purple tinted ─────────────────────────────── */
function ArtistFirst() {
  const pillars = [
    { label: "Artists",   desc: "Portfolios for every creator, at every career stage",   teal: false },
    { label: "Discovery", desc: "Explore art that moves you, follow the artists behind it", teal: true  },
    { label: "Community", desc: "Real relationships between artists and art lovers",      teal: false },
    { label: "Commerce",  desc: "Browse, buy, and sell directly between artist and collector", teal: true  },
  ];

  return (
    <section style={{
      position: "relative", overflow: "hidden",
      background: `linear-gradient(160deg, #faf8ff 0%, #ede9fe 45%, #f0f9ff 100%)`,
      padding: "96px 24px",
    }}>
      <div style={{ position: "absolute", top: -80, right: -80, width: 480, height: 480, borderRadius: "50%", background: `radial-gradient(circle, #ede9fe 0%, transparent 70%)`, pointerEvents: "none" }} />

      <div style={{ position: "relative", maxWidth: 1080, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 64, alignItems: "center" }}>
        <div>
          <Badge teal>Artist First</Badge>
          <h2 className="rg-h2" style={{ color: "#1a1a2e", margin: "20px 0 22px" }}>Built Around the Artist,<br />Not the Institution</h2>
          <p className="rg-body" style={{ color: "#374151", marginBottom: 16 }}>
            Professional tools, once reserved for elite galleries, now available to every artist.
            A verified profile. A complete catalog. A direct path to art lovers who are looking
            for exactly what you make.
          </p>
          <p className="rg-body" style={{ color: "#374151" }}>
            Art discovery should not require a gallery introduction. Social discovery,
            search, and recommendations mean your work finds its audience on its own merits.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {pillars.map(p => (
            <HoverCard key={p.label} style={{
              background: "#fff", borderRadius: 18, padding: "24px 20px",
              boxShadow: `0 2px 16px ${p.teal ? T : P}15`,
              border: `1px solid ${p.teal ? "rgba(13,148,136,0.14)" : "rgba(124,58,237,0.14)"}`,
            }}>
              <div className="rg-h3" style={{ color: p.teal ? T2 : P, marginBottom: 8, fontSize: "0.95rem" }}>{p.label}</div>
              <div className="rg-small" style={{ color: "#6b7280" }}>{p.desc}</div>
            </HoverCard>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── 4. HOW IT WORKS  ── teal tinted ─────────────────────────────────────── */
function HowItWorks() {
  const steps = [
    { num: "01", icon: <Upload style={{ width: 22, height: 22, color: "#fff" }} />, title: "Create or Collect", body: "Artists upload their work to build a living portfolio. Art lovers follow creators and save works they love." },
    { num: "02", icon: <Grid   style={{ width: 22, height: 22, color: "#fff" }} />, title: "Build Your Profile", body: "Artists curate their gallery their way. Art lovers build a collection that reflects their taste and eye." },
    { num: "03", icon: <Search style={{ width: 22, height: 22, color: "#fff" }} />, title: "Discover & Connect",  body: "Explore emerging and established artists, follow the ones that move you, and connect with a global creative community." },
    { num: "04", icon: <Globe  style={{ width: 22, height: 22, color: "#fff" }} />, title: "Buy, Sell, Connect",  body: "Artists list work in the Marketplace and connect directly with buyers. Art lovers find pieces they love and reach out to the artist personally." },
  ];

  return (
    <section style={{
      position: "relative", overflow: "hidden",
      background: `linear-gradient(155deg, #f0fdfa 0%, #ccfbf1 35%, #e0f2fe 100%)`,
      padding: "96px 24px",
    }}>
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: `linear-gradient(${T}15 1px, transparent 1px), linear-gradient(90deg, ${T}15 1px, transparent 1px)`,
        backgroundSize: "48px 48px",
      }} />
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: `radial-gradient(ellipse at 15% 50%, ${T}18 0%, transparent 50%), radial-gradient(ellipse at 85% 30%, ${P}0f 0%, transparent 50%)`,
      }} />

      <div style={{ position: "relative", maxWidth: 1080, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <h2 className="rg-h2" style={{ color: "#134e4a", marginBottom: 16 }}>How It Works</h2>
          <p className="rg-body-lg" style={{ color: "#0f766e", maxWidth: 460, margin: "0 auto" }}>
            From your first upload to a global audience. Four simple steps.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 }}>
          {steps.map((s, i) => (
            <HoverCard key={s.num} style={{
              background: "rgba(255,255,255,0.92)", borderRadius: 20, padding: "36px 26px",
              position: "relative", backdropFilter: "blur(4px)",
              boxShadow: "0 4px 24px rgba(13,148,136,0.1)",
              border: "1px solid rgba(13,148,136,0.14)",
            }}>
              <div style={{ position: "absolute", top: 16, right: 20, fontSize: "3rem", fontWeight: 900, lineHeight: 1, color: i < 2 ? `${T}1a` : `${P}1a`, userSelect: "none" }}>{s.num}</div>
              <div style={{ width: 52, height: 52, borderRadius: 14, marginBottom: 20, background: `linear-gradient(135deg, ${T}, ${T2})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 6px 18px ${T}40` }}>{s.icon}</div>
              <div style={{ width: 32, height: 3, borderRadius: 2, marginBottom: 16, background: `linear-gradient(90deg, ${T}, ${P})` }} />
              <h3 className="rg-h3" style={{ color: "#134e4a", marginBottom: 10, fontSize: "1rem" }}>{s.title}</h3>
              <p className="rg-body" style={{ color: "#374151" }}>{s.body}</p>
            </HoverCard>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── 5. FEATURES TABS ────────────────────────────────────────────────────── */
const TABS = [
  {
    id: "portfolio", label: "Portfolio",
    heading: "Share Your Work With the World",
    body: "Artists get a living portfolio that builds itself as they upload. Art lovers get a curated profile that reflects every piece they've saved and collected.",
    bullets: ["Auto-generated artist portfolio", "Art lover collection profiles", "Works organized by series or collection", "Optimized image display"],
    color: P, bg: LP,
  },
  {
    id: "discovery", label: "Discovery",
    heading: "Discover Art That Moves You",
    body: "Follow artists whose work resonates with you. Search by style or mood. No algorithm gatekeeping. Just art and the people who make it.",
    bullets: ["Follow artists and get notified", "Personalised recommendations", "Search by style, medium, or keyword", "Trending and featured collections"],
    color: T, bg: LT,
  },
  {
    id: "community", label: "Community",
    heading: "A Community Built Around Art",
    body: "Artists and art lovers connect through comments, direct messages, and a shared passion for authentic creative work — not algorithms.",
    bullets: ["Direct messaging", "Comments and engagement", "Artist spotlights and features", "A global community"],
    color: P, bg: LP,
  },
  {
    id: "marketplace", label: "Marketplace",
    heading: "Buy and Sell Without the Middleman",
    body: "Artists list their work and collectors reach out directly. No auction house, no gallery cut. Just a conversation between the person who made it and the person who loves it.",
    bullets: ["Artists list work in minutes", "Collectors browse and message directly", "No fees or middlemen", "On-platform checkout coming soon"],
    color: T, bg: LT,
  },
];

const ICONS: Record<string, React.ReactNode> = {
  portfolio: <Palette style={{ width: 15, height: 15 }} />, discovery: <Compass style={{ width: 15, height: 15 }} />,
  community: <MessageCircle style={{ width: 15, height: 15 }} />, marketplace: <TrendingUp style={{ width: 15, height: 15 }} />,
};
const LARGE_ICONS: Record<string, (c: string) => React.ReactNode> = {
  portfolio: c => <Palette style={{ width: 72, height: 72, color: c }} />,
  discovery: c => <Compass style={{ width: 72, height: 72, color: c }} />,
  community: c => <MessageCircle style={{ width: 72, height: 72, color: c }} />,
  marketplace: c => <TrendingUp style={{ width: 72, height: 72, color: c }} />,
};

function FeaturesTabbed() {
  const [active, setActive] = useState(0);
  const tab = TABS[active];

  return (
    <section style={{ position: "relative", overflow: "hidden", background: `linear-gradient(160deg, #faf8ff 0%, #f3e8ff 50%, #faf8ff 100%)`, padding: "96px 24px" }}>
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: `radial-gradient(ellipse at 90% 20%, ${P}18 0%, transparent 50%), radial-gradient(ellipse at 10% 80%, ${T}10 0%, transparent 50%)` }} />

      <div style={{ position: "relative", maxWidth: 1080, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h2 className="rg-h2" style={{ color: "#1a1a2e", marginBottom: 16 }}>Everything You Need</h2>
          <p className="rg-body-lg" style={{ color: "#4b5563", maxWidth: 460, margin: "0 auto" }}>Professional tools for artists and art lovers, all in one place.</p>
        </div>

        <div role="tablist" style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 40, flexWrap: "wrap" }}>
          {TABS.map((t, i) => (
            <button key={t.id} role="tab" aria-selected={i === active} aria-controls={`tp-${t.id}`} id={`tb-${t.id}`} onClick={() => setActive(i)}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 22px", borderRadius: 999, border: i === active ? `2px solid ${t.color}` : "2px solid transparent", background: i === active ? t.bg : "#fff", color: i === active ? t.color : "#6b7280", fontWeight: i === active ? 700 : 500, fontSize: "0.88rem", cursor: "pointer", transition: "all 0.2s", outline: "none", boxShadow: i === active ? `0 2px 12px ${t.color}22` : "0 1px 4px rgba(0,0,0,0.06)" }}
              onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 3px ${t.color}33`; }}
              onBlur={e => { e.currentTarget.style.boxShadow = i === active ? `0 2px 12px ${t.color}22` : "0 1px 4px rgba(0,0,0,0.06)"; }}
            >
              {ICONS[t.id]}{t.label}
            </button>
          ))}
        </div>

        <div id={`tp-${tab.id}`} role="tabpanel" aria-labelledby={`tb-${tab.id}`}
          style={{ background: "#fff", borderRadius: 24, padding: "48px 44px", border: `1px solid ${tab.color}28`, boxShadow: `0 8px 48px ${tab.color}18`, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 48, alignItems: "center" }}
        >
          <div>
            <div style={{ width: 60, height: 60, borderRadius: 16, marginBottom: 24, background: tab.color === P ? `linear-gradient(135deg, ${P}, ${P2})` : `linear-gradient(135deg, ${T}, ${T2})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 6px 20px ${tab.color}40` }}>
              {React.cloneElement(ICONS[tab.id] as React.ReactElement<any>, { style: { width: 22, height: 22, color: "#fff" } })}
            </div>
            <h3 className="rg-h3" style={{ color: "#1a1a2e", marginBottom: 16, fontSize: "1.3rem" }}>{tab.heading}</h3>
            <p className="rg-body" style={{ color: "#374151", marginBottom: 28 }}>{tab.body}</p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
              {tab.bullets.map(b => (
                <li key={b} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: "0.9rem", fontWeight: 500, color: "#374151" }}>
                  <div style={{ flexShrink: 0, marginTop: 2, width: 20, height: 20, borderRadius: "50%", background: tab.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Check style={{ width: 11, height: 11, color: tab.color }} />
                  </div>
                  {b}
                </li>
              ))}
            </ul>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 220 }}>
            <div style={{ position: "relative", width: 220, height: 220 }}>
              <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `2px solid ${tab.color}20`, background: `radial-gradient(circle at 35% 35%, ${tab.bg} 0%, white 65%)`, boxShadow: `0 0 80px ${tab.color}1a` }} />
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.35 }}>{LARGE_ICONS[tab.id](tab.color)}</div>
              <div style={{ position: "absolute", top: -6, right: -6, width: 36, height: 36, borderRadius: "50%", background: `linear-gradient(135deg, ${tab.color}, ${tab.color === P ? T : P})`, opacity: 0.7 }} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── 6. TIMELINE  ── dark purple, frosted cards ──────────────────────────── */
const TIMELINE = [
  { teal: true,  label: "Live Now",    title: "Artist Portfolios",              body: "Upload, organize, and share your entire body of work. The professional home your art deserves." },
  { teal: true,  label: "Live Now",    title: "Social Discovery",               body: "Art lovers explore and follow. Artists get found. A discovery engine built around genuine taste, not trending tags." },
  { teal: true,  label: "Live Now",    title: "Direct Messaging",               body: "Collectors reach out to artists. Artists connect with buyers. Real conversations between real people." },
  { teal: true,  label: "Live Now",    title: "Marketplace",                    body: "Artists list their work for sale. Collectors browse and buy directly. No middlemen, no markup, just art changing hands." },
  { teal: false, label: "Coming Soon", title: "Authentication Layer",            body: "A verification layer linking each artwork to its creator, producing a permanent trustworthy record of authorship and provenance." },
  { teal: false, label: "Coming Soon", title: "Certificates of Authentication", body: "Artists will issue official digital Certificates of Authentication, giving art lovers documented confidence in every piece they acquire." },
];

function ComingSoon() {
  return (
    <section style={{ position: "relative", overflow: "hidden", background: `linear-gradient(150deg, #1e1b4b 0%, ${P3} 40%, #1e3a5f 100%)`, padding: "96px 24px", color: "#fff" }}>
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: `radial-gradient(ellipse at 85% 15%, ${T}22 0%, transparent 50%), radial-gradient(ellipse at 10% 75%, ${P}30 0%, transparent 50%)` }} />
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: "radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

      <div style={{ position: "relative", maxWidth: 760, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <h2 className="rg-h2 rg-hero-glow-dark" style={{ color: "#fff", marginBottom: 16 }}>What We Are <span className="rg-grad-text-teal">Building</span></h2>
          <p className="rg-body-lg" style={{ color: "rgba(255,255,255,0.72)", maxWidth: 460, margin: "0 auto" }}>Live today, and what is on the horizon.</p>
        </div>

        <div style={{ position: "relative", paddingLeft: 40 }}>
          <div style={{ position: "absolute", left: 14, top: 0, bottom: 0, width: 2, background: `linear-gradient(180deg, ${T} 0%, ${T}99 50%, ${P}99 70%, ${P} 100%)`, borderRadius: 2 }} />

          {TIMELINE.map((item, i) => (
            <div key={item.title} style={{ position: "relative", marginBottom: i < TIMELINE.length - 1 ? 24 : 0 }}>
              <div style={{ position: "absolute", left: -33, top: 22, width: 24, height: 24, borderRadius: "50%", zIndex: 1, background: item.teal ? T : "rgba(255,255,255,0.08)", border: `2px solid ${item.teal ? T : P}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 12px ${item.teal ? T : P}66` }}>
                {item.teal ? <Check style={{ width: 11, height: 11, color: "#fff" }} /> : <div style={{ width: 8, height: 8, borderRadius: "50%", background: P }} />}
              </div>

              <div
                style={{ background: "rgba(255,255,255,0.07)", backdropFilter: "blur(12px)", borderRadius: 16, padding: "22px 26px", border: `1px solid ${item.teal ? T : P}30`, transition: "transform 0.2s, background 0.2s, box-shadow 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateX(6px)"; e.currentTarget.style.background = "rgba(255,255,255,0.12)"; e.currentTarget.style.boxShadow = `0 8px 32px ${item.teal ? T : P}28`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateX(0)"; e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.boxShadow = "none"; }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <span style={{ display: "inline-block", background: item.teal ? "rgba(13,148,136,0.25)" : "rgba(124,58,237,0.25)", color: item.teal ? "#5eead4" : "#c4b5fd", border: `1px solid ${item.teal ? "rgba(94,234,212,0.3)" : "rgba(196,181,253,0.3)"}`, borderRadius: 999, padding: "3px 12px", fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase" as const }}>{item.label}</span>
                  {!item.teal && <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#c4b5fd", fontWeight: 600 }}><Clock style={{ width: 11, height: 11 }} /> In Development</span>}
                </div>
                <h3 style={{ fontSize: "1.02rem", fontWeight: 800, letterSpacing: "-0.01em", color: "#fff", marginBottom: 6 }}>{item.title}</h3>
                <p className="rg-body" style={{ color: "rgba(255,255,255,0.72)", margin: 0 }}>{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── 7. FAQ ───────────────────────────────────────────────────────────────── */
const FAQS = [
  { q: "Is Regestra free to join?", a: "Yes. Creating an account, uploading artwork, and building your portfolio are all free. Advanced features are available as the platform grows." },
  { q: "Who is Regestra for?", a: "Regestra is built for two audiences: artists at every career stage who want a professional home for their work, and art lovers who want a trusted place to discover, follow, and collect from creators they believe in." },
  { q: "What is the Authentication Layer?", a: "A planned feature that will allow artists to formally register their work and produce a permanent trustworthy record of authorship. Currently in development." },
  { q: "What are Certificates of Authentication?", a: "Official digital documents artists will be able to issue for their work, giving art lovers documented confidence in what they acquire. Coming soon." },
  { q: "Can I sell my artwork on Regestra?", a: "Yes. The Marketplace is live now. List your artwork for sale and buyers can message you directly to arrange a purchase. On-platform checkout is coming soon." },
];

function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section style={{ position: "relative", overflow: "hidden", background: `linear-gradient(160deg, #faf8ff 0%, #ede9fe 45%, #f0f9ff 100%)`, padding: "96px 24px" }}>
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: `radial-gradient(ellipse at 85% 20%, ${P}14 0%, transparent 50%), radial-gradient(ellipse at 10% 80%, ${T}0c 0%, transparent 50%)` }} />

      <div style={{ position: "relative", maxWidth: 780, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <h2 className="rg-h2" style={{ color: "#1a1a2e", marginBottom: 14 }}>Common Questions</h2>
          <p className="rg-body-lg" style={{ color: "#4b5563" }}>Everything you need to know about getting started.</p>
        </div>

        <div style={{ background: "#fff", borderRadius: 24, overflow: "hidden", boxShadow: "0 8px 48px rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.1)" }}>
          {FAQS.map((faq, i) => {
            const isOpen = open === i;
            return (
              <div key={faq.q} style={{ borderBottom: i < FAQS.length - 1 ? "1px solid rgba(124,58,237,0.07)" : "none", background: isOpen ? LP : "transparent", transition: "background 0.2s" }}>
                <button onClick={() => setOpen(isOpen ? null : i)} aria-expanded={isOpen} aria-controls={`faq-p-${i}`} id={`faq-b-${i}`}
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "22px 28px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left", gap: 16, outline: "none" }}
                  onFocus={e => { e.currentTarget.style.boxShadow = `inset 0 0 0 2px ${P}33`; }}
                  onBlur={e => { e.currentTarget.style.boxShadow = "none"; }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ flexShrink: 0, width: 28, height: 28, borderRadius: 8, background: isOpen ? P : "#ede9fe", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s" }}>
                      <Zap style={{ width: 13, height: 13, color: isOpen ? "#fff" : P }} />
                    </div>
                    <span style={{ fontSize: "0.97rem", fontWeight: 700, letterSpacing: "-0.01em", color: isOpen ? P : "#1a1a2e" }}>{faq.q}</span>
                  </div>
                  <ChevronDown style={{ width: 18, height: 18, color: isOpen ? P : "#9ca3af", flexShrink: 0, transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.24s ease" }} />
                </button>
                {isOpen && (
                  <div id={`faq-p-${i}`} role="region" aria-labelledby={`faq-b-${i}`} style={{ padding: "0 28px 24px 70px", fontSize: "0.92rem", color: "#374151", lineHeight: 1.82 }}>{faq.a}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ── 8. CTA ──────────────────────────────────────────────────────────────── */
function CTA() {
  return (
    <section style={{ position: "relative", overflow: "hidden", background: `linear-gradient(145deg, ${P3} 0%, ${P2} 30%, ${P} 65%, ${T} 100%)`, padding: "100px 24px", color: "#fff", textAlign: "center" }}>
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: `radial-gradient(ellipse at 20% 30%, ${T}28 0%, transparent 50%), radial-gradient(ellipse at 80% 70%, ${P3}3a 0%, transparent 50%)` }} />
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: "radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

      <div style={{ position: "relative", maxWidth: 700, margin: "0 auto" }} className="lg:max-w-[860px]">
        <h2 className="rg-h2 rg-hero-glow-dark" style={{ color: "#fff", marginBottom: 22 }}>Your Art Journey <span className="rg-grad-text-teal">Starts Here.</span></h2>
        <p style={{ fontSize: "1.1rem", color: "rgba(255,255,255,0.85)", marginBottom: 44, lineHeight: 1.8 }} className="lg:whitespace-nowrap lg:tracking-[-0.01em]">Whether you're an artist ready to share your work or an art lover looking for your next favorite creator — Regestra was built for you.</p>
        <Link to="/sign-up">
          <Button size="xl" variant="primary-light" style={{ borderRadius: 999, fontWeight: 800, boxShadow: "0 8px 40px rgba(0,0,0,0.28)", fontSize: "1rem", padding: "16px 40px" }}>
            Get Started Free
            <ArrowRight style={{ marginLeft: 10, width: 18, height: 18 }} />
          </Button>
        </Link>
      </div>
    </section>
  );
}

/* ── PAGE ────────────────────────────────────────────────────────────────── */
export default function Landing() {
  const { currentUser } = useUser();

  /* Authenticated users see the social feed at "/" */
  if (currentUser) return <SocialFeed />;

  return (
    <div style={{ overflowX: "hidden" }}>
      <Hero />
      <ValueBand />
      <ArtistFirst />
      <HowItWorks />
      <FeaturesTabbed />
      <ComingSoon />
      <FAQ />
      <CTA />
    </div>
  );
}
