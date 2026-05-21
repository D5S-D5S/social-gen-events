"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import BrandLogo from "@/components/BrandLogo";
import { PRO_PLAN_PUBLICLY_AVAILABLE } from "@/lib/plans";

// ── Intersection observer hook ──────────────────────────────────────────────
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

// ── Data ────────────────────────────────────────────────────────────────────
const features = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
    title: "Get Paid Before You Start",
    desc: "Clients book and pay deposits instantly through your personalized booking page. No follow-ups. No excuses.",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      </svg>
    ),
    title: "Stop Leaving Money on the Table",
    desc: "Never overbuy balloons again. Track every item across every job. Know exactly what you need before you order.",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    ),
    title: "Send Quotes in 90 Seconds",
    desc: "Beautiful PDF quotes that close deals faster. Clients see exactly what they're paying for. You spend less time on paperwork.",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    title: "Turn One-Time Clients Into Repeat Customers",
    desc: "Every contact, every conversation, every past job in one place. Automated reminders so they think of you first next time.",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
    title: "Find Your Biggest Money-Makers",
    desc: "See exactly which jobs, months, and clients generate the most profit. Make smarter pricing decisions based on real data.",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    title: "Work Happens While You Sleep",
    desc: "Follow-ups, thank-you messages, and review requests all automated. Stop chasing clients. Let your system do it.",
  },
];

const testimonials = [
  {
    quote: "Bookings went from 3-4 a month to 8-10. The booking page does the work. Clients just pay the deposit and show up.",
    name: "Sarah Mitchell",
    role: "Solo decorator, London",
    initials: "SM",
  },
  {
    quote: "I stopped losing money on overbuying supplies. Inventory tracking shows me exactly what's needed for each job. Changed everything.",
    name: "Jade Williams",
    role: "Party decorator, Manchester",
    initials: "JW",
  },
  {
    quote: "Admin dropped from 5 hours a week to 1. Quotes are beautiful, follow-ups are automatic, bookings are faster. Worth every penny.",
    name: "Priya Patel",
    role: "Event stylist, Birmingham",
    initials: "PP",
  },
];

// ── Component ────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [annual, setAnnual] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const featuresRef = useInView();
  const howRef = useInView();
  const pricingRef = useInView();
  const testimonialsRef = useInView();

  return (
    <>
      <style>{`
        :root {
          --accent: #F05000;
          --accent-h: #D94600;
          --text: #0D0D0D;
          --text-2: #6B7280;
          --text-3: #9CA3AF;
          --border: #E5E7EB;
          --bg: #FFFFFF;
          --bg-2: #F9FAFB;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: 'DM Sans', -apple-system, sans-serif;
          background: var(--bg);
          color: var(--text);
          -webkit-font-smoothing: antialiased;
        }

        /* ── Nav ── */
        .nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          padding: 0 24px;
          height: 60px;
          display: flex; align-items: center; justify-content: space-between;
          transition: background 0.2s, border-color 0.2s, backdrop-filter 0.2s;
        }
        .nav.scrolled {
          background: rgba(255,255,255,0.85);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--border);
        }
        .nav-logo {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-weight: 700;
          font-size: 18px;
          letter-spacing: -0.02em;
          color: var(--text);
        }
        .nav-logo span { color: var(--accent); }
        .nav-links {
          display: flex; align-items: center; gap: 28px;
          list-style: none;
        }
        .nav-links a {
          font-size: 14px; font-weight: 500; color: var(--text-2);
          text-decoration: none; transition: color 0.15s;
        }
        .nav-links a:hover { color: var(--text); }
        .nav-actions { display: flex; align-items: center; gap: 10px; }
        .btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 16px; border-radius: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13.5px; font-weight: 600;
          cursor: pointer; text-decoration: none; white-space: nowrap;
          transition: all 0.15s; border: none;
        }
        .btn-ghost {
          background: transparent; color: var(--text-2);
          border: 1px solid transparent;
        }
        .btn-ghost:hover { background: var(--bg-2); color: var(--text); }
        .btn-primary {
          background: var(--accent); color: #fff;
          box-shadow: 0 1px 3px rgba(240,80,0,0.25);
        }
        .btn-primary:hover {
          background: var(--accent-h);
          box-shadow: 0 4px 12px rgba(240,80,0,0.3);
          transform: translateY(-1px);
        }
        .btn-outline {
          background: #fff; color: var(--text);
          border: 1px solid var(--border);
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        .btn-outline:hover {
          border-color: #D1D5DB;
          box-shadow: 0 2px 6px rgba(0,0,0,0.08);
          transform: translateY(-1px);
        }
        .btn-lg {
          padding: 12px 24px;
          font-size: 15px;
          border-radius: 10px;
        }

        /* ── Hero ── */
        .hero {
          padding: 140px 24px 80px;
          text-align: center;
          max-width: 760px;
          margin: 0 auto;
        }
        .hero-badge {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 5px 12px 5px 6px;
          background: #FFF4EF;
          border: 1px solid #FBBF9A;
          border-radius: 999px;
          font-size: 12.5px; font-weight: 600; color: var(--accent);
          margin-bottom: 28px;
        }
        .hero-badge-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--accent);
        }
        .hero h1 {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: clamp(40px, 6vw, 64px);
          font-weight: 800;
          letter-spacing: -0.03em;
          line-height: 1.08;
          color: var(--text);
          margin-bottom: 20px;
        }
        .hero h1 em {
          font-style: normal;
          color: var(--accent);
        }
        .hero-sub {
          font-size: 18px; line-height: 1.6;
          color: var(--text-2);
          max-width: 520px; margin: 0 auto 36px;
        }
        .hero-ctas {
          display: flex; align-items: center; justify-content: center; gap: 12px;
          flex-wrap: wrap;
        }
        .hero-note {
          margin-top: 14px;
          font-size: 12.5px; color: var(--text-3);
        }

        /* ── Video container ── */
        .video-wrap {
          max-width: 1060px;
          margin: 64px auto 0;
          padding: 0 24px;
        }
        .video-browser {
          background: #fff;
          border: 1px solid var(--border);
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0,0,0,0.04), 0 24px 80px rgba(0,0,0,0.10);
        }
        .video-browser-bar {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 16px;
          background: var(--bg-2);
          border-bottom: 1px solid var(--border);
        }
        .vb-dot {
          width: 10px; height: 10px; border-radius: 50%;
        }
        .vb-url {
          flex: 1; margin-left: 8px;
          background: var(--border);
          border-radius: 5px; height: 22px; max-width: 280px;
          display: flex; align-items: center; padding: 0 10px;
          font-size: 11px; color: var(--text-3);
          border: 1px solid #E5E7EB;
        }
        .video-browser video {
          display: block; width: 100%;
          aspect-ratio: 16/9;
          object-fit: cover;
        }

        /* ── Section ── */
        .section {
          padding: 96px 24px;
        }
        .section-inner {
          max-width: 1060px;
          margin: 0 auto;
        }
        .section-label {
          font-size: 12px; font-weight: 700;
          letter-spacing: 0.08em; text-transform: uppercase;
          color: var(--accent); margin-bottom: 12px;
        }
        .section-title {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: clamp(28px, 3.5vw, 42px);
          font-weight: 800; letter-spacing: -0.03em;
          color: var(--text); margin-bottom: 12px;
        }
        .section-sub {
          font-size: 16px; line-height: 1.65;
          color: var(--text-2); max-width: 480px;
        }
        .section-header { margin-bottom: 56px; }

        /* ── Features ── */
        .features-bg { background: var(--bg-2); }
        .feature-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1px;
          background: var(--border);
          border: 1px solid var(--border);
          border-radius: 14px;
          overflow: hidden;
        }
        @media (max-width: 768px) {
          .feature-grid { grid-template-columns: 1fr; }
          .nav-links { display: none; }
          .hero h1 { font-size: 36px; }
        }
        .feature-card {
          background: #fff;
          padding: 32px 28px;
          transition: background 0.15s;
        }
        .feature-card:hover { background: #FAFAFA; }
        .feature-icon {
          width: 36px; height: 36px;
          border: 1px solid var(--border);
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          color: var(--accent);
          margin-bottom: 16px;
          background: #fff;
        }
        .feature-title {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 15px; font-weight: 700;
          color: var(--text); margin-bottom: 8px;
        }
        .feature-desc {
          font-size: 13.5px; line-height: 1.6;
          color: var(--text-2);
        }

        /* ── How it works ── */
        .steps {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 40px; position: relative;
        }
        @media (max-width: 768px) { .steps { grid-template-columns: 1fr; gap: 28px; } }
        .step-num {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 11px; font-weight: 800;
          letter-spacing: 0.06em; text-transform: uppercase;
          color: var(--accent); margin-bottom: 12px;
        }
        .step-title {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 18px; font-weight: 700;
          color: var(--text); margin-bottom: 8px;
        }
        .step-desc {
          font-size: 14px; line-height: 1.65;
          color: var(--text-2);
        }
        .step-divider {
          width: 32px; height: 2px;
          background: var(--border);
          margin-bottom: 20px;
          border-radius: 2px;
        }

        /* ── Pricing ── */
        .pricing-bg { background: var(--bg-2); }
        .pricing-toggle {
          display: inline-flex; align-items: center; gap: 12px;
          background: var(--bg-2);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 4px;
          margin-bottom: 52px;
        }
        .pricing-toggle button {
          padding: 7px 16px;
          border-radius: 7px;
          font-size: 13px; font-weight: 600;
          cursor: pointer; border: none;
          transition: all 0.15s;
          background: transparent; color: var(--text-2);
        }
        .pricing-toggle button.active {
          background: #fff; color: var(--text);
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
        }
        .pricing-save {
          display: inline-flex;
          background: #ECFDF3;
          color: #12B76A;
          font-size: 11px; font-weight: 700;
          padding: 2px 8px; border-radius: 999px;
          border: 1px solid #A9EFC5;
        }
        .pricing-grid {
          display: grid; grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 20px; max-width: 1120px;
        }
        @media (max-width: 900px) { .pricing-grid { grid-template-columns: 1fr; } }
        .pricing-card {
          background: #fff;
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 32px;
          position: relative;
        }
        .pricing-card.featured {
          border-color: var(--accent);
          box-shadow: 0 0 0 1px var(--accent), 0 8px 32px rgba(240,80,0,0.1);
        }
        .pricing-featured-badge {
          position: absolute; top: -11px; left: 50%; transform: translateX(-50%);
          background: var(--accent); color: #fff;
          font-size: 11px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase;
          padding: 3px 12px; border-radius: 999px;
          white-space: nowrap;
        }
        .pricing-plan {
          font-size: 13px; font-weight: 700;
          color: var(--text-2); margin-bottom: 8px;
          text-transform: uppercase; letter-spacing: 0.06em;
        }
        .pricing-price {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 44px; font-weight: 800;
          letter-spacing: -0.04em; color: var(--text);
          line-height: 1;
        }
        .pricing-price sup {
          font-size: 22px; vertical-align: super; font-weight: 700;
          letter-spacing: 0;
        }
        .pricing-period {
          font-size: 13px; color: var(--text-3); margin-top: 4px; margin-bottom: 24px;
        }
        .pricing-divider {
          height: 1px; background: var(--border); margin: 24px 0;
        }
        .pricing-features {
          list-style: none; display: flex; flex-direction: column; gap: 11px;
          margin-bottom: 28px;
        }
        .pricing-features li {
          display: flex; align-items: flex-start; gap: 10px;
          font-size: 13.5px; color: var(--text-2);
        }
        .pricing-check {
          width: 16px; height: 16px; flex-shrink: 0; margin-top: 1px;
          color: var(--accent);
        }

        /* ── Testimonials ── */
        .testimonials-grid {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;
        }
        @media (max-width: 768px) { .testimonials-grid { grid-template-columns: 1fr; } }
        .testimonial-card {
          background: #fff;
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 28px;
        }
        .testimonial-quote {
          font-size: 14.5px; line-height: 1.65;
          color: var(--text); margin-bottom: 20px;
        }
        .testimonial-author { display: flex; align-items: center; gap: 12px; }
        .testimonial-avatar {
          width: 36px; height: 36px; border-radius: 50%;
          background: var(--accent); color: #fff;
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 700; flex-shrink: 0;
        }
        .testimonial-name {
          font-size: 13px; font-weight: 700; color: var(--text);
        }
        .testimonial-role {
          font-size: 12px; color: var(--text-3);
        }

        /* ── CTA banner ── */
        .cta-banner {
          background: var(--text);
          border-radius: 20px;
          padding: 64px 48px;
          text-align: center;
          max-width: 760px;
          margin: 0 auto;
        }
        .cta-banner h2 {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: clamp(28px, 3.5vw, 38px);
          font-weight: 800; letter-spacing: -0.03em;
          color: #fff; margin-bottom: 14px;
        }
        .cta-banner p {
          font-size: 16px; color: rgba(255,255,255,0.6); margin-bottom: 32px;
        }
        .btn-white {
          background: #fff; color: var(--text);
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
        .btn-white:hover {
          background: #F9FAFB;
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(0,0,0,0.25);
        }

        /* ── Footer ── */
        .footer {
          padding: 48px 24px;
          border-top: 1px solid var(--border);
        }
        .footer-inner {
          max-width: 1060px; margin: 0 auto;
          display: flex; align-items: center; justify-content: space-between; gap: 20px;
          flex-wrap: wrap;
        }
        .footer-logo {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 16px; font-weight: 700;
        }
        .footer-logo span { color: var(--accent); }
        .footer-links {
          display: flex; gap: 24px; list-style: none;
        }
        .footer-links a {
          font-size: 13px; color: var(--text-3); text-decoration: none;
          transition: color 0.15s;
        }
        .footer-links a:hover { color: var(--text); }
        .footer-copy {
          font-size: 12px; color: var(--text-3);
        }

        /* ── Animations ── */
        .reveal { opacity: 0; transform: translateY(18px); transition: opacity 0.5s ease, transform 0.5s ease; }
        .reveal.in { opacity: 1; transform: none; }
        .reveal-delay-1 { transition-delay: 0.08s; }
        .reveal-delay-2 { transition-delay: 0.16s; }
        .reveal-delay-3 { transition-delay: 0.24s; }
        .reveal-delay-4 { transition-delay: 0.32s; }
        .reveal-delay-5 { transition-delay: 0.40s; }
        .reveal-delay-6 { transition-delay: 0.48s; }
      `}</style>

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <nav className={`nav ${scrolled ? "scrolled" : ""}`}>
        <BrandLogo />
        <ul className="nav-links">
          <li><a href="#features">Features</a></li>
          <li><a href="#how">How it works</a></li>
          <li><a href="#pricing">Pricing</a></li>
        </ul>
        <div className="nav-actions">
          <Link href="/login" className="btn btn-ghost">Log in</Link>
          <Link href="/signup" className="btn btn-primary">Start free</Link>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-badge">
          <div className="hero-badge-dot" />
          Built specifically for balloon decorators
        </div>
        <h1>
          Stop losing clients to chaos.<br />
          <em>Double your bookings instead.</em>
        </h1>
        <p className="hero-sub">
          Most balloon decorators are leaving money on the table. Missed follow-ups. No system for quotes. Inventory mistakes that kill profit. BalloonBase fixes all of it — in one place where it all works together.
        </p>
        <div className="hero-ctas">
          <Link href="/signup" className="btn btn-primary btn-lg">
            Start your free trial
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </Link>
          <Link href="/login" className="btn btn-outline btn-lg">Watch it work</Link>
        </div>
        <p className="hero-note">No credit card required &nbsp;·&nbsp; 7-day free trial included</p>
      </section>

      {/* ── Video hero ────────────────────────────────────────────────────── */}
      <div className="video-wrap">
        <div className="video-browser">
          <div className="video-browser-bar">
            <div className="vb-dot" style={{ background: "#FF5F57" }} />
            <div className="vb-dot" style={{ background: "#FFBD2E" }} />
            <div className="vb-dot" style={{ background: "#28C840" }} />
            <div className="vb-url">app.balloonbase.co</div>
          </div>
          <video
            src="/hero.mp4"
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
          />
        </div>
      </div>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section className="section features-bg" id="features">
        <div className="section-inner">
          <div ref={featuresRef.ref} className="section-header">
            <p className="section-label">What You Get</p>
            <h2 className={`section-title reveal ${featuresRef.inView ? "in" : ""}`}>
              The system that turns decorators<br />into real business owners.
            </h2>
            <p className={`section-sub reveal reveal-delay-1 ${featuresRef.inView ? "in" : ""}`}>
              We built this specifically for how balloon decorators work. Stop settling for generic tools that don't understand your business.
            </p>
          </div>
          <div className="feature-grid">
            {features.map((f, i) => (
              <div
                key={f.title}
                className={`feature-card reveal reveal-delay-${Math.min(i + 1, 6)} ${featuresRef.inView ? "in" : ""}`}
              >
                <div className="feature-icon">{f.icon}</div>
                <div className="feature-title">{f.title}</div>
                <div className="feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────────── */}
      <section className="section" id="how">
        <div className="section-inner">
          <div ref={howRef.ref} className="section-header">
            <p className="section-label">How it works</p>
            <h2 className={`section-title reveal ${howRef.inView ? "in" : ""}`}>From zero to booking machine in days.</h2>
            <p className={`section-sub reveal reveal-delay-1 ${howRef.inView ? "in" : ""}`}>
              No complicated setup. No training calls needed. Just sign up, share your link, and watch bookings come in.
            </p>
          </div>
          <div className="steps">
            {[
              {
                n: "Step 01",
                title: "Set up your workspace (2 minutes)",
                desc: "Add your business info, services, and pricing. That's it. BalloonBase does the rest.",
              },
              {
                n: "Step 02",
                title: "Share your booking link (literally)",
                desc: "Drop it in your Instagram bio, WhatsApp, or website. Clients book and pay deposits instantly. No more text negotiations.",
              },
              {
                n: "Step 03",
                title: "Stop the chaos. Start the money.",
                desc: "Everything lives in one place. Bookings. Inventory. Quotes. Clients. Analytics. Stop juggling WhatsApp, spreadsheets, and email.",
              },
            ].map((s, i) => (
              <div
                key={s.n}
                className={`reveal reveal-delay-${i + 1} ${howRef.inView ? "in" : ""}`}
              >
                <div className="step-num">{s.n}</div>
                <div className="step-divider" />
                <div className="step-title">{s.title}</div>
                <div className="step-desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────────────────────────── */}
      <section className="section pricing-bg" id="pricing">
        <div className="section-inner">
          <div ref={pricingRef.ref} className="section-header">
            <p className="section-label">Pricing</p>
            <h2 className={`section-title reveal ${pricingRef.inView ? "in" : ""}`}>Pricing that grows with you.</h2>
            <p className={`section-sub reveal reveal-delay-1 ${pricingRef.inView ? "in" : ""}`}>
              Start for free. All plans include a 7-day trial. No credit card. Cancel anytime.
            </p>
          </div>

          <div className={`pricing-toggle reveal reveal-delay-2 ${pricingRef.inView ? "in" : ""}`}>
            <button className={!annual ? "active" : ""} onClick={() => setAnnual(false)}>Monthly</button>
            <button className={annual ? "active" : ""} onClick={() => setAnnual(true)}>
              Annual <span className="pricing-save" style={{ marginLeft: 6 }}>2 months free</span>
            </button>
          </div>

          <div className={`pricing-grid reveal reveal-delay-3 ${pricingRef.inView ? "in" : ""}`}>
            {/* Starter */}
            <div className="pricing-card">
              <div className="pricing-plan">Starter</div>
              <div className="pricing-price">
                <sup>$</sup>{annual ? "16.66" : "19.99"}
              </div>
              <div className="pricing-period">per month{annual ? ", billed annually" : ""}</div>
              <div className="pricing-divider" />
              <ul className="pricing-features">
                {[
                  "Up to 50 bookings/month",
                  "Quick & detailed quotes",
                  "Basic inventory (100 items)",
                  "Customer CRM (100 contacts)",
                  "Email support",
                  "7-day free trial"
                ].map(item => (
                  <li key={item}>
                    <svg className="pricing-check" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="2 8 6 12 14 4"/>
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="btn btn-outline" style={{ width: "100%", justifyContent: "center" }}>
                Start free trial
              </Link>
            </div>

            {/* Pro */}
            <div className="pricing-card featured">
              <div className="pricing-featured-badge">{PRO_PLAN_PUBLICLY_AVAILABLE ? "Most popular" : "Coming soon"}</div>
              <div className="pricing-plan">Pro</div>
              <div className="pricing-price">
                <sup>$</sup>{annual ? "41.66" : "49.99"}
              </div>
              <div className="pricing-period">per month{annual ? ", billed annually" : ""}</div>
              <div className="pricing-divider" />
              <ul className="pricing-features">
                {[
                  "Unlimited bookings",
                  "Unlimited inventory tracking",
                  "AI Length Estimator & Mockup Generator",
                  "200 AI tokens per month",
                  "Unlimited customers & quotes",
                  "Google & Microsoft Calendar sync",
                  "Priority email support",
                  "7-day free trial"
                ].map(item => (
                  <li key={item}>
                    <svg className="pricing-check" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="2 8 6 12 14 4"/>
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href={PRO_PLAN_PUBLICLY_AVAILABLE ? "/signup?plan=pro" : "/waitlist?plan=pro"} className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                {PRO_PLAN_PUBLICLY_AVAILABLE ? "Start free trial" : "Join waitlist"}
              </Link>
            </div>

            {/* Max */}
            <div className="pricing-card">
              <div className="pricing-featured-badge" style={{ background: "#111827" }}>Coming soon</div>
              <div className="pricing-plan">Max</div>
              <div className="pricing-price">
                <sup>$</sup>{annual ? "83.33" : "99.99"}
              </div>
              <div className="pricing-period">per month{annual ? ", billed annually" : ""}</div>
              <div className="pricing-divider" />
              <ul className="pricing-features">
                {[
                  "Everything in Pro",
                  "800 AI tokens per month",
                  "Advanced AI reference library",
                  "Multi-user team workspace",
                  "Multiple client workspaces",
                  "Advanced analytics & reporting",
                  "Phone & priority support",
                  "7-day free trial"
                ].map(item => (
                  <li key={item}>
                    <svg className="pricing-check" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="2 8 6 12 14 4"/>
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/waitlist?plan=max" className="btn btn-outline" style={{ width: "100%", justifyContent: "center" }}>
                Join waitlist
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────────── */}
      <section className="section" id="testimonials">
        <div className="section-inner">
          <div ref={testimonialsRef.ref} className="section-header">
            <p className="section-label">Testimonials</p>
            <h2 className={`section-title reveal ${testimonialsRef.inView ? "in" : ""}`}>
              Decorators love it.
            </h2>
          </div>
          <div className="testimonials-grid">
            {testimonials.map((t, i) => (
              <div
                key={t.name}
                className={`testimonial-card reveal reveal-delay-${i + 1} ${testimonialsRef.inView ? "in" : ""}`}
              >
                <p className="testimonial-quote">&ldquo;{t.quote}&rdquo;</p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar">{t.initials}</div>
                  <div>
                    <div className="testimonial-name">{t.name}</div>
                    <div className="testimonial-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA banner ───────────────────────────────────────────────────── */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="section-inner">
          <div className="cta-banner">
            <h2>Stop leaving money on the table.</h2>
            <p>Start your free 7-day trial. No credit card required. Cancel anytime.</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/signup" className="btn btn-white btn-lg">
                Get started free
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="footer">
        <div className="footer-inner">
          <BrandLogo size="sm" />
          <ul className="footer-links">
            <li><a href="#features">Features</a></li>
            <li><a href="#pricing">Pricing</a></li>
            <li><Link href="/login">Login</Link></li>
            <li><Link href="/signup">Sign up</Link></li>
          </ul>
          <div className="footer-copy">&copy; {new Date().getFullYear()} BalloonBase. All rights reserved.</div>
        </div>
      </footer>
    </>
  );
}
