"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const links = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/colleges", label: "Colleges" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <nav className={`pub-navbar${scrolled ? " pub-navbar--scrolled" : ""}`}>
      <div className="pub-container pub-navbar-inner">
        <Link href="/" className="pub-navbar-logo" aria-label="MyUniversitys Home">
          <div className="pub-logo-icon" style={{ background: "transparent", boxShadow: "none" }}>
            <Image src="/logo.png" alt="MyUniversitys Logo" width={38} height={38} style={{ borderRadius: "8px" }} />
          </div>
          <span className="pub-logo-text">MyUniversitys</span>
        </Link>
        <div className="pub-navbar-links">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className={`pub-nav-link${pathname === l.href ? " pub-nav-link--active" : ""}`}>{l.label}</Link>
          ))}
        </div>
        <div className="pub-navbar-actions">
          <a href="#download" className="pub-btn pub-btn-primary pub-btn--sm">Download App</a>
        </div>
        <button className="pub-burger" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
          <span className="pub-burger-line" /><span className="pub-burger-line" /><span className="pub-burger-line" />
        </button>
      </div>
      {mobileOpen && (
        <div className="pub-mobile-menu">
          {links.map((l) => (<Link key={l.href} href={l.href} className={`pub-mobile-link${pathname === l.href ? " pub-mobile-link--active" : ""}`}>{l.label}</Link>))}
          <a href="#download" className="pub-btn pub-btn-primary" style={{ marginTop: 8 }}>Download App</a>
        </div>
      )}
    </nav>
  );
}

function Footer() {
  return (
    <footer className="pub-footer">
      <div className="pub-container">
        <div className="pub-footer-grid">
          <div className="pub-footer-brand">
            <div className="pub-navbar-logo" style={{ marginBottom: 16 }}>
              <div className="pub-logo-icon" style={{ background: "transparent", boxShadow: "none" }}>
                <Image src="/logo.png" alt="MyUniversitys Logo" width={38} height={38} style={{ borderRadius: "8px" }} />
              </div>
              <span className="pub-logo-text">MyUniversitys</span>
            </div>
            <p className="pub-footer-desc">India&apos;s smartest education referral platform. Refer students, earn rewards, and help shape futures.</p>
          </div>
          <div className="pub-footer-col">
            <h4>Quick Links</h4>
            <Link href="/">Home</Link>
            <Link href="/about">About Us</Link>
            <Link href="/colleges">Colleges</Link>
            <Link href="/contact">Contact</Link>
          </div>
          <div className="pub-footer-col">
            <h4>Legal</h4>
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms &amp; Conditions</Link>
          </div>
          <div className="pub-footer-col">
            <h4>Contact</h4>
            <a href="mailto:support@myuniversitys.com">support@myuniversitys.com</a>
            <p>Chennai, Tamil Nadu, India</p>
          </div>
        </div>
        <div className="pub-footer-bottom">
          <p>&copy; {new Date().getFullYear()} MyUniversitys. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default function PublicShell({ children }: { children: React.ReactNode }) {
  return (<><Navbar /><main>{children}</main><Footer /></>);
}
