import React from "react";

const PURPLE = "#7c3aed";
const TEAL   = "#0d9488";
const LP     = "#f5f3ff";

const IconFacebook = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const IconInstagram = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
  </svg>
);

const IconX = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const IconLinkedIn = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const IconMail = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M2 7l10 7 10-7" />
  </svg>
);

const SOCIALS = [
  { label: "Facebook",  href: "https://www.facebook.com/profile.php?id=61586745208110", icon: <IconFacebook /> },
  { label: "Instagram", href: "https://www.instagram.com/regestraart/",                icon: <IconInstagram /> },
  { label: "X",         href: "https://x.com/regestraart",                             icon: <IconX /> },
  { label: "LinkedIn",  href: "https://www.linkedin.com/company/regestra/",             icon: <IconLinkedIn /> },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer style={{ background: "#fff", borderTop: "1px solid rgba(0,0,0,0.07)" }}>
      <div style={{
        maxWidth: 1200, margin: "0 auto",
        padding: "24px 32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 16,
      }}>

        {/* Copyright */}
        <p style={{ fontSize: "0.8rem", color: "#9ca3af", margin: 0, whiteSpace: "nowrap" }}>
          &copy; {year} Regestra, Inc.
        </p>

        {/* Follow Us + Contact stacked on the right */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>

          {/* Follow us + icons */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{
              fontSize: "0.72rem", fontWeight: 700, color: "#9ca3af",
              letterSpacing: "0.08em", textTransform: "uppercase",
              whiteSpace: "nowrap",
            }}>
              Follow Us
            </span>

            <div style={{ display: "flex", gap: 8 }}>
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  title={s.label}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    width: 36, height: 36, borderRadius: 9,
                    background: LP, color: PURPLE,
                    textDecoration: "none",
                    transition: "background 0.16s, color 0.16s, transform 0.16s",
                    flexShrink: 0,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = PURPLE;
                    e.currentTarget.style.color = "#fff";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = LP;
                    e.currentTarget.style.color = PURPLE;
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{
              fontSize: "0.72rem", fontWeight: 700, color: "#9ca3af",
              letterSpacing: "0.08em", textTransform: "uppercase",
              whiteSpace: "nowrap",
            }}>
              Contact
            </span>
            <a
              href="mailto:mail@regestra.com"
              aria-label="Email Regestra"
              style={{
                display: "flex", alignItems: "center", gap: 6,
                fontSize: "0.8rem", color: PURPLE,
                textDecoration: "none",
                transition: "color 0.16s",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={e => { e.currentTarget.style.color = TEAL; }}
              onMouseLeave={e => { e.currentTarget.style.color = PURPLE; }}
            >
              <IconMail />
              mail@regestra.com
            </a>
          </div>

        </div>

      </div>
    </footer>
  );
}
