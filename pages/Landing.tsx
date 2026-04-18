import React, { useState, useEffect, useRef } from "react";
import { useUser } from "../context/UserContext";
import SocialFeed from "../components/SocialFeed";
import { Link } from "react-router-dom";
import {
  ArrowRight, Sparkles, Palette, Globe,
  Clock, MessageCircle, TrendingUp, ChevronDown,
  Check, Users, Compass, ShoppingBag, Award,
} from "lucide-react";

/* ── Brand tokens ──────────────────────────────────────────────────── */
const P  = "#7c3aed";
const P2 = "#6d28d9";
const P3 = "#5b21b6";
const T  = "#0d9488";
const T2 = "#0f766e";
const LP = "#f5f3ff";
const LT = "#f0fdfa";

/* ── Unsplash images — with UTM so CORS works in browser ─────────────
   All images use the Unsplash CDN with auto=format for best loading   */
const IMG = {
  heroArtist:   "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&w=1600&q=80",
  studioDetail: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&w=900&q=80",
  gallery:      "https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&w=1400&q=80",
  handsDetail:  "https://images.unsplash.com/photo-1541961017774-22349e4a1262?auto=format&w=900&q=80",
  collector:    "https://images.unsplash.com/photo-1578321272176-b7bbc0679853?auto=format&w=1200&q=80",
  palette:      "https://images.unsplash.com/photo-1615184697985-c9bde1b07da7?auto=format&w=900&q=80",
  galleryWall:  "https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&w=1400&q=80",
};

/* ── Scroll fade ───────────────────────────────────────────────────── */
function useFadeIn(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVis(true); obs.disconnect(); }
    }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, vis };
}
function FadeIn({ children, delay = 0, style = {} }: {
  children: React.ReactNode; delay?: number; style?: React.CSSProperties;
}) {
  const { ref, vis } = useFadeIn();
  return (
    <div ref={ref} style={{
      opacity: vis ? 1 : 0,
      transform: vis ? "translateY(0)" : "translateY(24px)",
      transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
      ...style,
    }}>{children}</div>
  );
}

/* ── Img with fallback purple bg so layout never breaks ────────────── */
function Photo({ src, alt, style = {} }: { src: string; alt: string; style?: React.CSSProperties }) {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      style={{ display: "block", backgroundColor: `${P}22`, ...style }}
      onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = "0.3"; }}
    />
  );
}

/* ══════════════════════════════════════════════════════════════════
   1. HERO
══════════════════════════════════════════════════════════════════ */
function Hero() {
  const words = ["Art Lovers.", "Galleries.", "Dreamers.", "Believers."];
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 3800);
    return () => clearInterval(id);
  }, []);

  return (
    <section style={{ position: "relative", overflow: "hidden", minHeight: "94vh", display: "flex", alignItems: "center" }}>
      {/* Background photo */}
      <Photo
        src={IMG.heroArtist}
        alt="Artist at work"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 30%" }}
      />
      {/* Brand purple overlay */}
      <div style={{
        position: "absolute", inset: 0,
        background: `linear-gradient(115deg, ${P3}f2 0%, ${P2}d8 35%, ${P}b0 62%, rgba(13,148,136,0.65) 100%)`,
      }} />
      {/* Bottom fade */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 140, background: "linear-gradient(to bottom, transparent, #faf8ff)", pointerEvents: "none" }} />
      {/* Dot grid */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)", backgroundSize: "30px 30px", pointerEvents: "none" }} />

      <div style={{ position: "relative", maxWidth: 1200, margin: "0 auto", padding: "clamp(100px,13vw,160px) clamp(20px,5vw,48px) clamp(120px,15vw,180px)", width: "100%" }}>
        {/* Eyebrow */}
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 32,
          background: "rgba(255,255,255,0.15)", backdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.3)", borderRadius: 999,
          padding: "8px 20px", fontSize: 11, fontWeight: 700,
          letterSpacing: "0.12em", textTransform: "uppercase", color: "#fff",
        }}>
          <Sparkles style={{ width: 12, height: 12 }} />
          For Artists &amp; Art Lovers
        </span>

        {/* Headline */}
        <h1 style={{
          fontSize: "clamp(3.2rem, 9vw, 7.6rem)", fontWeight: 900,
          letterSpacing: "-0.04em", lineHeight: 0.94,
          color: "#fff", margin: "0 0 24px",
          hyphens: "none",
        }}>
          <span style={{ display: "block" }}>Art That</span>
          <span style={{
            display: "block",
            background: "linear-gradient(100deg, #e9d5ff 0%, #99f6e4 65%)",
            WebkitBackgroundClip: "text", backgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>Connects</span>
          <span style={{ display: "block", fontSize: "0.6em", color: "rgba(255,255,255,0.95)", marginTop: 6 }}>People Who Care.</span>
        </h1>

        {/* Animated word */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
          <span style={{ fontSize: "clamp(1rem, 1.8vw, 1.1rem)", color: "rgba(255,255,255,0.88)", fontWeight: 500 }}>A platform made for Artists and</span>
          <span key={tick} style={{
            fontSize: "clamp(1rem, 1.8vw, 1.1rem)", fontWeight: 800, color: "#99f6e4",
            animation: "rg-word-pop 0.38s cubic-bezier(0.34,1.56,0.64,1) both",
          }}>{words[tick % words.length]}</span>
        </div>

        <p style={{
          fontSize: "clamp(1rem, 1.7vw, 1.1rem)", color: "rgba(255,255,255,0.85)",
          maxWidth: 460, lineHeight: 1.78, marginBottom: 44,
          fontWeight: 400, hyphens: "none",
        }}>
          A place to share your work, discover what moves you, and find the people who truly see it.
        </p>

        {/* CTAs */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 56 }}>
          <Link to="/sign-up" style={{ textDecoration: "none" }}>
            <button style={{
              display: "inline-flex", alignItems: "center", gap: 10, padding: "15px 34px",
              borderRadius: 999, fontSize: "1rem", fontWeight: 800,
              background: "#fff", color: P2, border: "none", cursor: "pointer",
              boxShadow: "0 8px 40px rgba(0,0,0,0.25)",
              transition: "transform 0.18s, box-shadow 0.18s",
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 16px 48px rgba(0,0,0,0.3)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 8px 40px rgba(0,0,0,0.25)"; }}
            >
              Start for Free <ArrowRight style={{ width: 17, height: 17 }} />
            </button>
          </Link>
          <Link to="/gallery" style={{ textDecoration: "none" }}>
            <button style={{
              display: "inline-flex", alignItems: "center", gap: 8, padding: "15px 28px",
              borderRadius: 999, fontSize: "1rem", fontWeight: 700,
              color: "#fff", background: "rgba(255,255,255,0.12)",
              border: "1.5px solid rgba(255,255,255,0.38)",
              cursor: "pointer", backdropFilter: "blur(8px)",
              transition: "background 0.18s",
            }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.22)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; }}
            >
              Browse as an Art Lover
            </button>
          </Link>
        </div>

        {/* Trust row */}
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          {[
            { icon: <Palette style={{ width: 13, height: 13 }} />, text: "Artist Portfolios" },
            { icon: <ShoppingBag style={{ width: 13, height: 13 }} />, text: "Marketplace" },
            { icon: <Award style={{ width: 13, height: 13 }} />, text: "Certificates" },
            { icon: <Globe style={{ width: 13, height: 13 }} />, text: "Global Community" },
          ].map(c => (
            <span key={c.text} style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.65)", fontSize: 12, fontWeight: 600, letterSpacing: "0.03em" }}>
              {c.icon}{c.text}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   2. INTRO — mission + photo mosaic
══════════════════════════════════════════════════════════════════ */
function IntroBand() {
  return (
    <section style={{ background: "#faf8ff", padding: "clamp(64px,8vw,100px) clamp(20px,5vw,48px)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "clamp(40px,6vw,80px)",
          alignItems: "center",
        }}>
          <FadeIn>
            <div>
              <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: P, marginBottom: 20 }}>Our Mission</p>
              <h2 style={{
                fontSize: "clamp(2rem, 4.5vw, 3.4rem)", fontWeight: 900,
                letterSpacing: "-0.03em", lineHeight: 1.02,
                color: "#1a1a2e", margin: "0 0 20px", hyphens: "none",
              }}>
                Where art finds<br />
                <span style={{ background: `linear-gradient(135deg, ${P}, ${T})`, WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  its audience.
                </span>
              </h2>
              <p style={{ fontSize: "1rem", color: "#1a1a2e", lineHeight: 1.9, marginBottom: 14, fontWeight: 500, hyphens: "none" }}>
                Regestra is where artists and art lovers find each other. Creators build a presence that lasts. Art lovers discover work they genuinely fall for.
              </p>
              <p style={{ fontSize: "1rem", color: "#374151", lineHeight: 1.9, hyphens: "none" }}>
                No gatekeepers, no commission walls. Just the art and the people who are drawn to it.
              </p>
            </div>
          </FadeIn>

          {/* Photo mosaic — fixed row heights so it never collapses */}
          <FadeIn delay={100}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gridTemplateRows: "180px 180px",
              gap: 10,
            }}>
              {/* Tall left photo spans both rows */}
              <div style={{ gridRow: "span 2", borderRadius: 18, overflow: "hidden", boxShadow: `0 8px 32px ${P}22` }}>
                <Photo src={IMG.studioDetail} alt="Artist at canvas" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <div style={{ borderRadius: 18, overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }}>
                <Photo src={IMG.palette} alt="Artist palette" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <div style={{ borderRadius: 18, overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }}>
                <Photo src={IMG.handsDetail} alt="Artist hands" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   3. VALUE CARDS — equal-height grid on purple gradient
══════════════════════════════════════════════════════════════════ */
function ValueCards() {
  const cards = [
    { accent: P,  title: "Living Portfolios", body: "Your work, always current and beautifully presented. Artists get a portfolio worth sharing. Art lovers get a personal feed that actually reflects their taste.", icon: <Palette style={{ width: 26, height: 26, color: "#fff" }} /> },
    { accent: T,  title: "Real Connections",  body: "Follow the artists you love. Build an audience that genuinely cares. Talk to art lovers and creators the way you would in person.", icon: <Users style={{ width: 26, height: 26, color: "#fff" }} /> },
    { accent: P,  title: "Direct Commerce",   body: "See something you love? Reach out directly. No auction house fees, no gallery overhead. Just you and the artist who created it.", icon: <ShoppingBag style={{ width: 26, height: 26, color: "#fff" }} /> },
    { accent: T,  title: "Authenticated Art", body: "Every piece traces back to its creator. A verifiable record that gives art lovers peace of mind and gives artists the recognition they deserve.", icon: <Award style={{ width: 26, height: 26, color: "#fff" }} /> },
  ];

  return (
    <section style={{
      background: `linear-gradient(145deg, ${P3} 0%, ${P2} 40%, ${P} 70%, ${T} 100%)`,
      padding: "clamp(72px,9vw,108px) clamp(20px,5vw,48px)",
      position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: `radial-gradient(ellipse at 80% 20%, ${T}28 0%, transparent 50%)` }} />
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: "radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

      <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative" }}>
        <FadeIn>
          <div style={{ textAlign: "center", marginBottom: "clamp(40px,5vw,60px)" }}>
            <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.7)", marginBottom: 14 }}>Everything in One Place</p>
            <h2 style={{ fontSize: "clamp(2rem, 4.5vw, 3.2rem)", fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.05, color: "#fff", margin: 0, hyphens: "none" }}>
              Authentic Art. Trusted Connections.
            </h2>
          </div>
        </FadeIn>

        {/* Cards grid — alignItems:stretch ensures equal height */}
        <div className="rg-value-grid" style={{
          display: "grid",
          gap: 18,
          alignItems: "stretch",
        }}>
          {cards.map((c, i) => (
            <FadeIn key={c.title} delay={i * 70} style={{ display: "flex" }}>
              <div style={{
                flex: 1,
                background: "rgba(255,255,255,0.97)",
                borderRadius: 22,
                padding: "clamp(24px,3vw,36px) clamp(20px,2.5vw,30px)",
                boxShadow: "0 4px 28px rgba(0,0,0,0.18)",
                display: "flex", flexDirection: "column",
                transition: "transform 0.22s, box-shadow 0.22s",
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-5px)"; e.currentTarget.style.boxShadow = "0 18px 48px rgba(0,0,0,0.22)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 4px 28px rgba(0,0,0,0.18)"; }}
              >
                <div style={{ width: 54, height: 54, borderRadius: 14, marginBottom: 20, background: `linear-gradient(135deg, ${c.accent}, ${c.accent === P ? T : P2})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `0 6px 18px ${c.accent}44` }}>
                  {c.icon}
                </div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 800, letterSpacing: "-0.015em", color: "#1a1a2e", marginBottom: 10, hyphens: "none" }}>{c.title}</h3>
                <p style={{ fontSize: "0.9rem", color: "#374151", lineHeight: 1.8, margin: 0, flexGrow: 1, hyphens: "none" }}>{c.body}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   4. ARTIST FIRST — split with photo
══════════════════════════════════════════════════════════════════ */
function ArtistFirst() {
  return (
    <section style={{
      background: `linear-gradient(160deg, #faf8ff 0%, #ede9fe 55%, #f0fdfa 100%)`,
      padding: "clamp(80px,10vw,124px) clamp(20px,5vw,48px)",
      position: "relative", overflow: "hidden",
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "clamp(48px,7vw,96px)", alignItems: "center" }}>

        {/* Phone mockup */}
        <FadeIn>
          <div style={{ position: "relative", display: "flex", justifyContent: "center" }}>

            {/* Phone device frame + Regestra UI */}
            <div style={{ position: "relative", width: "100%", maxWidth: 320 }}>

              {/* Outer phone shell */}
              <div style={{
                position: "relative",
                background: "linear-gradient(160deg, #1a1a2e 0%, #16213e 100%)",
                borderRadius: 44,
                padding: "14px 10px",
                boxShadow: `0 32px 80px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.08), inset 0 0 0 1px rgba(255,255,255,0.04)`,
              }}>
                {/* Side buttons */}
                <div style={{ position: "absolute", left: -3, top: 90, width: 3, height: 32, background: "#2a2a3e", borderRadius: "2px 0 0 2px" }} />
                <div style={{ position: "absolute", left: -3, top: 132, width: 3, height: 54, background: "#2a2a3e", borderRadius: "2px 0 0 2px" }} />
                <div style={{ position: "absolute", right: -3, top: 110, width: 3, height: 54, background: "#2a2a3e", borderRadius: "0 2px 2px 0" }} />

                {/* Screen bezel */}
                <div style={{
                  background: "#fff",
                  borderRadius: 34,
                  overflow: "hidden",
                  position: "relative",
                }}>
                  {/* Status bar */}
                  <div style={{ background: "#7c3aed", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 16px 4px" }}>
                    <span style={{ fontSize: 8, fontWeight: 700, color: "#fff" }}>9:41</span>
                    <div style={{ width: 60, height: 10, background: "rgba(0,0,0,0.3)", borderRadius: 99, margin: "0 auto" }} />
                    <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
                      <div style={{ width: 10, height: 6, border: "1px solid rgba(255,255,255,0.8)", borderRadius: 1, position: "relative" }}>
                        <div style={{ position: "absolute", inset: "1px 2px 1px 1px", background: "#fff", borderRadius: 1 }} />
                      </div>
                    </div>
                  </div>

                  {/* App header */}
                  <div style={{ background: "linear-gradient(160deg, #7c3aed 0%, #6d28d9 50%, #0d9488 100%)", padding: "10px 14px 18px" }}>
                    {/* Nav */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>regestra</span>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <div style={{ width: 18, height: 18, borderRadius: "50%", border: "1.5px solid rgba(255,255,255,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(255,255,255,0.7)" }} />
                        </div>
                      </div>
                    </div>
                    {/* Eyebrow */}
                    <div style={{ fontSize: 8, fontWeight: 600, color: "rgba(255,255,255,0.65)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>Regestra Dev</div>
                    {/* Title */}
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 3, letterSpacing: "-0.02em" }}>Regestra Wallet</div>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,0.75)", marginBottom: 14, lineHeight: 1.4 }}>Your artwork certificates and ownership records</div>
                    {/* Stat tiles */}
                    <div style={{ display: "flex", gap: 8 }}>
                      {[{ n: "24", l: "OWNED" }, { n: "26", l: "ISSUED" }].map(s => (
                        <div key={s.l} style={{ flex: 1, background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)", borderRadius: 10, padding: "8px 6px", textAlign: "center" }}>
                          <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", lineHeight: 1 }}>{s.n}</div>
                          <div style={{ fontSize: 7, color: "rgba(255,255,255,0.65)", letterSpacing: "0.1em", marginTop: 3 }}>{s.l}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tabs bar */}
                  <div style={{ display: "flex", alignItems: "center", padding: "8px 12px 6px", borderBottom: "1px solid #f3e8ff", background: "#fff", gap: 6 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "#7c3aed", background: "#f5f3ff", borderRadius: 99, padding: "4px 10px", border: "1px solid #ede9fe" }}>Owned 24</div>
                    <div style={{ fontSize: 9, fontWeight: 500, color: "#9ca3af", padding: "4px 6px" }}>Issued 26</div>
                    <div style={{ marginLeft: "auto", fontSize: 9, color: "#7c3aed", fontWeight: 600 }}>Explorer →</div>
                  </div>

                  {/* Certificate card */}
                  <div style={{ padding: "10px 12px 14px", background: "#fff" }}>
                    <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #ede9fe", position: "relative", boxShadow: "0 2px 12px rgba(124,58,237,0.08)" }}>
                      <Photo
                        src="https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?auto=format&w=400&q=80"
                        alt="Certificate artwork"
                        style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", display: "block" }}
                      />
                      {/* Verified badge */}
                      <div style={{ position: "absolute", top: 7, right: 7, background: "rgba(13,148,136,0.93)", borderRadius: 99, padding: "3px 8px", display: "flex", alignItems: "center", gap: 4, backdropFilter: "blur(4px)" }}>
                        <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#99f6e4" }} />
                        <span style={{ fontSize: 7, fontWeight: 700, color: "#fff", letterSpacing: "0.04em" }}>Verified</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating verified badge */}
              <div style={{
                position: "absolute", bottom: -18, right: -20,
                background: "#fff", borderRadius: 16, padding: "14px 18px",
                boxShadow: `0 8px 32px ${P}28`,
                display: "flex", alignItems: "center", gap: 10,
              }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: `linear-gradient(135deg, ${P}, ${T})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Award style={{ width: 21, height: 21, color: "#fff" }} />
                </div>
                <div>
                  <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "#1a1a2e" }}>Verified Artist</div>
                  <div style={{ fontSize: "0.72rem", color: "#9ca3af", fontWeight: 500 }}>Certified by Regestra</div>
                </div>
              </div>
            </div>

          </div>
        </FadeIn>

        {/* Text */}
        <FadeIn delay={110}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: P, marginBottom: 18 }}>Artist First</p>
            <h2 style={{ fontSize: "clamp(1.9rem, 4vw, 3.1rem)", fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.05, color: "#1a1a2e", margin: "0 0 20px", hyphens: "none" }}>
              Built for the Artist.<br />Not the Institution.
            </h2>
            <p style={{ fontSize: "1rem", color: "#1a1a2e", lineHeight: 1.8, marginBottom: 14, fontWeight: 500, hyphens: "none" }}>
              The tools that once lived behind gallery doors are finally yours. A verified profile, a beautiful catalog, and a direct line to art lovers who are already looking for exactly what you make.
            </p>
            <p style={{ fontSize: "1rem", color: "#374151", lineHeight: 1.8, marginBottom: 32, hyphens: "none" }}>
              Your work deserves to be found on its own terms. Not because you knew the right person in the right room.
            </p>
            {/* 2x2 feature bullets */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 16px", marginBottom: 36 }}>
              {["Artist Portfolios", "Social Discovery", "Direct Messaging", "Marketplace"].map((item, i) => (
                <div key={item} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <div style={{ flexShrink: 0, width: 22, height: 22, borderRadius: "50%", background: i % 2 === 0 ? LP : LT, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Check style={{ width: 11, height: 11, color: i % 2 === 0 ? P : T }} />
                  </div>
                  <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "#1a1a2e" }}>{item}</span>
                </div>
              ))}
            </div>
            <Link to="/sign-up" style={{ textDecoration: "none" }}>
              <button style={{
                display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 28px",
                borderRadius: 999, fontSize: "0.9rem", fontWeight: 800,
                background: `linear-gradient(135deg, ${P}, ${T})`, color: "#fff",
                border: "none", cursor: "pointer", boxShadow: `0 6px 24px ${P}40`,
                transition: "transform 0.18s",
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ""; }}
              >
                Create Your Portfolio <ArrowRight style={{ width: 15, height: 15 }} />
              </button>
            </Link>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   5. GALLERY STRIP — full-bleed photo + collector message
══════════════════════════════════════════════════════════════════ */
function GalleryStrip() {
  return (
    <section style={{ background: "#fff", overflow: "hidden" }}>
      {/* Full-width photo with overlay text — uses padding instead of fixed height so content never clips on mobile */}
      <div style={{ position: "relative" }}>
        <Photo src={IMG.gallery} alt="Art gallery" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 40%" }} />
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(90deg, ${P2}e0 0%, ${P}b0 50%, transparent 100%)` }} />
        {/* Content uses padding so it always has room — no clipping */}
        <div style={{ position: "relative", padding: "clamp(48px,8vw,80px) clamp(24px,6vw,80px)", maxWidth: 640 }}>
          <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.7)", marginBottom: 14 }}>For Art Lovers</p>
          <h2 style={{ fontSize: "clamp(1.7rem, 4vw, 3.2rem)", fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.05, color: "#fff", margin: "0 0 16px", hyphens: "none" }}>
            Discover art you will love<br />before anyone else does.
          </h2>
          <p style={{ fontSize: "0.98rem", color: "rgba(255,255,255,0.92)", lineHeight: 1.78, marginBottom: 28, maxWidth: 380, fontWeight: 500, hyphens: "none" }}>
            Follow the artists you believe in, save the works that stay with you, and reach out whenever you're ready. No intermediaries, no hidden premiums.
          </p>
          <Link to="/gallery" style={{ textDecoration: "none", display: "inline-block" }}>
            <button style={{
              display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 24px",
              borderRadius: 999, fontSize: "0.9rem", fontWeight: 800,
              background: "#fff", color: P2, border: "none", cursor: "pointer",
              boxShadow: "0 4px 20px rgba(0,0,0,0.2)", transition: "transform 0.18s",
              marginBottom: "clamp(40px,7vw,72px)",
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; }}
            >
              Explore the Gallery <ArrowRight style={{ width: 15, height: 15 }} />
            </button>
          </Link>
        </div>
      </div>
      {/* 3-thumbnail strip */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", height: "clamp(100px,15vw,200px)" }}>
        {[IMG.collector, IMG.galleryWall, IMG.handsDetail].map((src, i) => (
          <div key={i} style={{ overflow: "hidden", position: "relative" }}>
            <Photo src={src} alt="Art detail" style={{
              width: "100%", height: "100%", objectFit: "cover", display: "block",
              transition: "transform 0.5s",
            }}
              onMouseEnter={(e: React.MouseEvent<HTMLImageElement>) => { e.currentTarget.style.transform = "scale(1.05)"; }}
              onMouseLeave={(e: React.MouseEvent<HTMLImageElement>) => { e.currentTarget.style.transform = "scale(1)"; }}
            />
            <div style={{ position: "absolute", inset: 0, background: `${P}18` }} />
          </div>
        ))}
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   6. HOW IT WORKS — equal-height step cards
══════════════════════════════════════════════════════════════════ */
function HowItWorks() {
  const steps = [
    { num: "01", title: "Create or Collect",    body: "Upload your work and build a portfolio that grows as you do. Or begin following the artists whose work quietly stops you in your tracks." },
    { num: "02", title: "Build Your Profile",   body: "Artists shape their own space. Art lovers build a personal collection that feels like a reflection of who they are." },
    { num: "03", title: "Discover and Connect", body: "Find artists you never would have come across otherwise. Follow the ones that genuinely move you. Reach out. This is what an art community can feel like." },
    { num: "04", title: "Buy, Sell, Connect",   body: "See something you need to own? Message the artist directly. No intermediaries, no added cost. Just a real conversation between two people who love what art can do." },
  ];

  return (
    <section style={{
      background: `linear-gradient(155deg, #f0fdfa 0%, #ede9fe 50%, #f8f5ff 100%)`,
      padding: "clamp(80px,10vw,116px) clamp(20px,5vw,48px)",
      position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: `linear-gradient(${T}10 1px, transparent 1px), linear-gradient(90deg, ${T}10 1px, transparent 1px)`, backgroundSize: "48px 48px" }} />

      <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative" }}>
        <FadeIn>
          <div style={{ textAlign: "center", marginBottom: "clamp(44px,5vw,68px)" }}>
            <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: T, marginBottom: 14 }}>How It Works</p>
            <h2 style={{ fontSize: "clamp(2rem, 4.5vw, 3.4rem)", fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.05, color: "#134e4a", margin: 0, hyphens: "none" }}>
              From your first upload<br />to a global audience.
            </h2>
          </div>
        </FadeIn>

        <div className="rg-how-grid" style={{ display: "grid", gap: 18, alignItems: "stretch" }}>
          {steps.map((s, i) => (
            <FadeIn key={s.num} delay={i * 80} style={{ display: "flex" }}>
              <div style={{
                flex: 1,
                background: "rgba(255,255,255,0.94)", borderRadius: 22,
                padding: "clamp(24px,3vw,36px) clamp(20px,2.5vw,28px)",
                boxShadow: "0 4px 22px rgba(13,148,136,0.1)",
                border: "1px solid rgba(13,148,136,0.1)",
                display: "flex", flexDirection: "column",
                transition: "transform 0.2s, box-shadow 0.2s",
                position: "relative", overflow: "hidden",
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-5px)"; e.currentTarget.style.boxShadow = "0 16px 44px rgba(13,148,136,0.18)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 4px 22px rgba(13,148,136,0.1)"; }}
              >
                {/* Ghost number */}
                <div style={{ position: "absolute", top: 12, right: 16, fontSize: "3.6rem", fontWeight: 900, lineHeight: 1, color: i % 2 === 0 ? `${P}0d` : `${T}0f`, userSelect: "none", letterSpacing: "-0.04em" }}>{s.num}</div>
                {/* Step badge */}
                <div style={{ width: 50, height: 50, borderRadius: 14, marginBottom: 18, background: `linear-gradient(135deg, ${i % 2 === 0 ? P : T}, ${i % 2 === 0 ? T : P2})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `0 6px 18px ${i % 2 === 0 ? P : T}40` }}>
                  <span style={{ fontSize: "1rem", fontWeight: 900, color: "#fff" }}>{s.num}</span>
                </div>
                <div style={{ width: 28, height: 3, borderRadius: 2, marginBottom: 14, background: `linear-gradient(90deg, ${i % 2 === 0 ? P : T}, transparent)` }} />
                <h3 style={{ fontSize: "1.05rem", fontWeight: 800, letterSpacing: "-0.015em", color: "#134e4a", marginBottom: 10, hyphens: "none" }}>{s.title}</h3>
                <p style={{ fontSize: "0.88rem", color: "#374151", lineHeight: 1.8, margin: 0, flexGrow: 1, hyphens: "none" }}>{s.body}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   7. FEATURES TABS — with real photos inside panel
══════════════════════════════════════════════════════════════════ */
const TABS = [
  { id: "portfolio",   label: "Portfolio",   heading: "Your Work, Always Looking Its Best",       body: "Upload once and your portfolio takes shape around you. Artists get a home that does justice to their work. Art lovers get a profile that feels genuinely theirs.",                                                                                                         bullets: ["Auto generated artist portfolio", "Art lover collection profiles", "Works organized by series", "Optimized image display"],                                           color: P, bg: LP, photo: 0 },
  { id: "discovery",   label: "Discovery",   heading: "Find Art That Actually Stops You",          body: "No feed chasing trends. Just artists whose work resonates with you, easy to find and easy to stay close to.",                                                                                                                                                         bullets: ["Follow artists and get notified", "Personalized recommendations", "Search by style or medium", "Trending and featured collections"],                    color: T, bg: LT, photo: 1 },
  { id: "community",   label: "Community",   heading: "A Real Community Around Art",               body: "Artists and art lovers talk directly. Leave a comment, send a message, or simply follow someone whose work stays with you. Real people, real conversations.",                                                                                                                    bullets: ["Direct messaging", "Comments and engagement", "Artist spotlights", "A global community"],                                                           color: P, bg: LP, photo: 2 },
  { id: "marketplace", label: "Marketplace", heading: "Buy and Sell, Person to Person",            body: "No auction house, no gallery commission. You find something you love, you reach out to the person who made it, and you take it from there.",                                                                                                                      bullets: ["List artwork in minutes", "Art lovers message directly", "No fees or middlemen", "Integrated checkout coming soon"],                              color: T, bg: LT, photo: 3 },
];
const PHOTOS_FOR_TAB = [IMG.studioDetail, IMG.galleryWall, IMG.collector, IMG.handsDetail];
const TAB_ICONS: Record<string, React.ReactNode> = {
  portfolio:   <Palette       style={{ width: 15, height: 15 }} />,
  discovery:   <Compass       style={{ width: 15, height: 15 }} />,
  community:   <MessageCircle style={{ width: 15, height: 15 }} />,
  marketplace: <TrendingUp    style={{ width: 15, height: 15 }} />,
};

function FeaturesTabbed() {
  const [active, setActive] = useState(0);
  const tab = TABS[active];

  return (
    <section style={{ background: `linear-gradient(160deg, #faf8ff 0%, #f3e8ff 50%, #faf8ff 100%)`, padding: "clamp(80px,10vw,116px) clamp(20px,5vw,48px)", position: "relative", overflow: "hidden" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <FadeIn>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 40, flexWrap: "wrap", gap: 20 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: P, marginBottom: 12 }}>Features</p>
              <h2 style={{ fontSize: "clamp(1.9rem,4vw,3.1rem)", fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.05, color: "#1a1a2e", margin: 0, hyphens: "none" }}>Everything You Need</h2>
            </div>
            <div role="tablist" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {TABS.map((t, i) => (
                <button key={t.id} role="tab" aria-selected={i === active} onClick={() => setActive(i)} style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "9px 18px",
                  borderRadius: 999, outline: "none", cursor: "pointer",
                  border: i === active ? `2px solid ${t.color}` : "2px solid transparent",
                  background: i === active ? t.bg : "rgba(255,255,255,0.75)",
                  color: i === active ? t.color : "#6b7280",
                  fontWeight: i === active ? 800 : 500, fontSize: "0.84rem",
                  transition: "all 0.18s",
                  boxShadow: i === active ? `0 2px 10px ${t.color}22` : "none",
                }}>{TAB_ICONS[t.id]}&nbsp;{t.label}</button>
              ))}
            </div>
          </div>
        </FadeIn>

        <div style={{
          background: "#fff", borderRadius: 26,
          padding: "clamp(28px,4.5vw,48px)",
          border: `1.5px solid ${tab.color}20`,
          boxShadow: `0 10px 52px ${tab.color}10`,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "clamp(28px,4vw,48px)",
          alignItems: "center",
        }}>
          <div>
            <div style={{ width: 58, height: 58, borderRadius: 16, marginBottom: 22, background: tab.color === P ? `linear-gradient(135deg,${P},${P2})` : `linear-gradient(135deg,${T},${T2})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 6px 22px ${tab.color}44` }}>
              {React.cloneElement(TAB_ICONS[tab.id] as React.ReactElement<any>, { style: { width: 23, height: 23, color: "#fff" } })}
            </div>
            <h3 style={{ fontSize: "clamp(1.15rem,2.5vw,1.65rem)", fontWeight: 900, letterSpacing: "-0.025em", color: "#1a1a2e", marginBottom: 12, hyphens: "none" }}>{tab.heading}</h3>
            <p style={{ fontSize: "0.93rem", color: "#374151", lineHeight: 1.82, marginBottom: 26, hyphens: "none" }}>{tab.body}</p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              {tab.bullets.map(b => (
                <li key={b} style={{ display: "flex", alignItems: "flex-start", gap: 11, fontSize: "0.9rem", fontWeight: 500, color: "#374151", hyphens: "none" }}>
                  <div style={{ flexShrink: 0, marginTop: 2, width: 20, height: 20, borderRadius: "50%", background: tab.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Check style={{ width: 11, height: 11, color: tab.color }} />
                  </div>
                  {b}
                </li>
              ))}
            </ul>
          </div>
          {/* Photo changes per tab */}
          <div style={{ borderRadius: 18, overflow: "hidden", boxShadow: `0 8px 36px ${tab.color}18` }}>
            <Photo
              src={PHOTOS_FOR_TAB[active]}
              alt={tab.heading}
              style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", display: "block" }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   8. ROADMAP — purple gradient, equal-height cards
══════════════════════════════════════════════════════════════════ */
const TIMELINE = [
  { teal: true,  label: "Live Now",    title: "Artist Portfolios",            body: "Upload, organize, and present your work the way it deserves to be seen. A professional home that is entirely yours." },
  { teal: true,  label: "Live Now",    title: "Social Discovery",             body: "Discover artists you would never have come across otherwise. Follow the ones that stay with you. Get found by people who genuinely care." },
  { teal: true,  label: "Live Now",    title: "Direct Messaging",             body: "Reach out to artists. Connect with art lovers. Honest conversations with no platform standing between you." },
  { teal: true,  label: "Live Now",    title: "Marketplace",                  body: "List your work, browse and buy, connect with buyers directly. No fees, no markups, no waiting for someone else's approval." },
  { teal: true,  label: "Live Now",    title: "Authentication Layer",          body: "A permanent record that connects every piece to its creator. Provenance you can point to with confidence." },
  { teal: true,  label: "Live Now",    title: "Certificates of Authenticity", body: "Artists issue a verified digital certificate with every sale. Art lovers know exactly what they own and where it came from." },
];

function Roadmap() {
  return (
    <section style={{
      background: `linear-gradient(150deg, ${P3} 0%, ${P2} 45%, #1e3a5f 100%)`,
      padding: "clamp(80px,10vw,116px) clamp(20px,5vw,48px)",
      position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: `radial-gradient(ellipse at 85% 15%, ${T}22 0%, transparent 50%)` }} />
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: "radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

      <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative" }}>
        <FadeIn>
          <div style={{ textAlign: "center", marginBottom: "clamp(44px,6vw,68px)" }}>
            <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.6)", marginBottom: 14 }}>Roadmap</p>
            <h2 style={{ fontSize: "clamp(2rem,4.5vw,3.4rem)", fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.05, color: "#fff", margin: 0, hyphens: "none" }}>
              What We Are{" "}
              <span style={{ background: "linear-gradient(90deg,#99f6e4,#c4b5fd)", WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent" }}>Building</span>
            </h2>
          </div>
        </FadeIn>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 14, alignItems: "stretch" }}>
          {TIMELINE.map((item, i) => (
            <FadeIn key={item.title} delay={i * 55} style={{ display: "flex" }}>
              <div style={{
                flex: 1,
                background: "rgba(255,255,255,0.08)", backdropFilter: "blur(12px)",
                borderRadius: 20, padding: "24px 26px",
                border: `1px solid ${item.teal ? T : P}35`,
                display: "flex", flexDirection: "column",
                transition: "background 0.2s, transform 0.2s",
              }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.14)"; e.currentTarget.style.transform = "translateY(-3px)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.transform = ""; }}
              >
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 5, marginBottom: 12, alignSelf: "flex-start",
                  background: item.teal ? "rgba(13,148,136,0.25)" : "rgba(124,58,237,0.25)",
                  color: item.teal ? "#5eead4" : "#c4b5fd",
                  border: `1px solid ${item.teal ? "rgba(94,234,212,0.28)" : "rgba(196,181,253,0.28)"}`,
                  borderRadius: 999, padding: "4px 12px",
                  fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const,
                }}>
                  {item.teal ? <Check style={{ width: 10, height: 10 }} /> : <Clock style={{ width: 10, height: 10 }} />}
                  {item.label}
                </span>
                <h3 style={{ fontSize: "1rem", fontWeight: 800, letterSpacing: "-0.015em", color: "#fff", marginBottom: 8, hyphens: "none" }}>{item.title}</h3>
                <p style={{ fontSize: "0.87rem", color: "rgba(255,255,255,0.82)", lineHeight: 1.78, margin: 0, flexGrow: 1, hyphens: "none" }}>{item.body}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   9. FAQ
══════════════════════════════════════════════════════════════════ */
const FAQS = [
  { q: "Is Regestra free to join?",               a: "Always. Creating your account, uploading work, and building a portfolio is completely free. More features are on the way as the platform evolves." },
  { q: "Who is Regestra for?",                    a: "Artists at any point in their journey who want a genuine home for their work, and art lovers who want a better way to discover, follow, and collect from creators they believe in." },
  { q: "What is the Authentication Layer?",       a: "A tool that lets artists formally register their work and create a permanent, verifiable record of authorship that anyone can look up." },
  { q: "What are Certificates of Authenticity?", a: "Verified digital certificates issued by the artist at the point of sale. Art lovers always know exactly what they own and can trace it back to its source." },
  { q: "Can I sell my artwork on Regestra?",      a: "Yes, today. List your work in the Marketplace and interested buyers can reach out directly. Integrated checkout is coming soon." },
];

function FAQ() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section style={{ background: `linear-gradient(160deg,#faf8ff 0%,#ede9fe 50%,#f0fdfa 100%)`, padding: "clamp(80px,10vw,116px) clamp(20px,5vw,48px)", position: "relative" }}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        <FadeIn>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: P, marginBottom: 14 }}>FAQ</p>
            <h2 style={{ fontSize: "clamp(2rem,4.5vw,3.2rem)", fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.05, color: "#1a1a2e", margin: 0, hyphens: "none" }}>Common Questions</h2>
          </div>
        </FadeIn>
        <div style={{ background: "#fff", borderRadius: 26, overflow: "hidden", boxShadow: `0 12px 52px ${P}0e`, border: `1.5px solid ${P}14` }}>
          {FAQS.map((faq, i) => {
            const isOpen = open === i;
            return (
              <div key={faq.q} style={{ borderBottom: i < FAQS.length - 1 ? "1px solid rgba(124,58,237,0.07)" : "none", background: isOpen ? LP : "transparent", transition: "background 0.2s" }}>
                <button onClick={() => setOpen(isOpen ? null : i)} aria-expanded={isOpen} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 28px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left", gap: 16, outline: "none" }}>
                  <span style={{ fontSize: "0.95rem", fontWeight: 700, letterSpacing: "-0.01em", color: isOpen ? P : "#1a1a2e", hyphens: "none" }}>{faq.q}</span>
                  <ChevronDown style={{ width: 18, height: 18, color: isOpen ? P : "#9ca3af", flexShrink: 0, transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.22s" }} />
                </button>
                {isOpen && <div style={{ padding: "0 28px 22px", fontSize: "0.92rem", color: "#374151", lineHeight: 1.82, hyphens: "none" }}>{faq.a}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   10. CTA — gallery wall photo + purple overlay
══════════════════════════════════════════════════════════════════ */
function CTA() {
  return (
    <section style={{ position: "relative", overflow: "hidden", minHeight: 540, display: "flex", alignItems: "center" }}>
      <Photo src={IMG.galleryWall} alt="Art gallery" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${P3}f2 0%, ${P2}de 38%, ${P}c0 68%, ${T}99 100%)` }} />
      <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)", backgroundSize: "28px 28px", pointerEvents: "none" }} />

      <div style={{ position: "relative", maxWidth: 800, margin: "0 auto", padding: "clamp(96px,12vw,140px) clamp(20px,5vw,48px)", textAlign: "center", color: "#fff" }}>
        <FadeIn>
          <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.65)", marginBottom: 22 }}>Join Regestra</p>
          <h2 style={{ fontSize: "clamp(2.4rem, 6vw, 5rem)", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 0.96, color: "#fff", margin: "0 0 24px", hyphens: "none" }}>
            Your Art Journey<br />
            <span style={{ background: "linear-gradient(100deg,#e9d5ff,#99f6e4)", WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Starts Here.
            </span>
          </h2>
          <p style={{ fontSize: "clamp(0.96rem,1.8vw,1.1rem)", color: "rgba(255,255,255,0.88)", margin: "0 auto 44px", lineHeight: 1.8, maxWidth: 480, fontWeight: 500, hyphens: "none" }}>
            Whether you make art or are drawn to it, this was built for you. Come and see what has been waiting.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/sign-up" style={{ textDecoration: "none" }}>
              <button style={{
                display: "inline-flex", alignItems: "center", gap: 10, padding: "16px 38px",
                borderRadius: 999, fontSize: "1rem", fontWeight: 800,
                background: "#fff", color: P2, border: "none", cursor: "pointer",
                boxShadow: "0 8px 40px rgba(0,0,0,0.25)", transition: "transform 0.18s, box-shadow 0.18s",
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 14px 52px rgba(0,0,0,0.3)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 8px 40px rgba(0,0,0,0.25)"; }}
              >
                Start for Free <ArrowRight style={{ width: 17, height: 17 }} />
              </button>
            </Link>
            <Link to="/gallery" style={{ textDecoration: "none" }}>
              <button style={{
                display: "inline-flex", alignItems: "center", gap: 8, padding: "16px 30px",
                borderRadius: 999, fontSize: "1rem", fontWeight: 700, color: "#fff",
                background: "rgba(255,255,255,0.12)", border: "1.5px solid rgba(255,255,255,0.38)",
                cursor: "pointer", transition: "background 0.18s",
              }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.22)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; }}
              >
                Explore the Gallery
              </button>
            </Link>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ── Global keyframes ─────────────────────────────────────────────── */
function GlobalStyles() {
  return (
    <style>{`
      @keyframes rg-word-pop {
        0%   { opacity: 0; transform: translateY(7px) scale(0.95); }
        100% { opacity: 1; transform: translateY(0) scale(1); }
      }
      /* Prevent browser hyphenation on all landing text */
      .rg-landing * {
        hyphens: none !important;
        -webkit-hyphens: none !important;
        overflow-wrap: normal;
        word-break: normal;
      }
      /* Mobile — stack to 1 column */
      @media (max-width: 640px) {
        .rg-landing section { overflow-x: hidden; }
        .rg-how-grid,
        .rg-value-grid {
          grid-template-columns: 1fr;
          gap: 16px;
        }
      }
      /* Tablet — exactly 2 columns, equal width */
      @media (min-width: 641px) and (max-width: 1023px) {
        .rg-how-grid,
        .rg-value-grid {
          grid-template-columns: 1fr 1fr;
          gap: 22px;
        }
        .rg-how-grid > *,
        .rg-value-grid > * {
          min-height: 220px;
        }
      }
      /* Desktop — 4 columns */
      @media (min-width: 1024px) {
        .rg-how-grid,
        .rg-value-grid {
          grid-template-columns: repeat(4, 1fr);
          gap: 18px;
        }
      }
    `}</style>
  );
}

/* ── Page ─────────────────────────────────────────────────────────── */
export default function Landing() {
  const { currentUser } = useUser();
  if (currentUser) return <SocialFeed />;

  return (
    <div className="rg-landing" style={{ overflowX: "hidden" }}>
      <GlobalStyles />
      <Hero />
      <IntroBand />
      <ValueCards />
      <ArtistFirst />
      <GalleryStrip />
      <HowItWorks />
      <FeaturesTabbed />
      <Roadmap />
      <FAQ />
      <CTA />
    </div>
  );
}
