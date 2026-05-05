"use client";

import { useState } from "react";
import PublicShell from "../components/PublicShell";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <PublicShell>
      <section className="pub-page-hero">
        <div className="pub-container">
          <h1>Get in Touch</h1>
          <p>Have questions? Want to partner with us? We&apos;d love to hear from you.</p>
        </div>
      </section>

      <section className="pub-section">
        <div className="pub-container">
          <div className="pub-contact-grid">
            {/* Info */}
            <div className="pub-contact-info">
              <div>
                <h2 style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: 8 }}>Let&apos;s Connect</h2>
                <p style={{ color: "var(--pub-text-secondary)", lineHeight: 1.7, marginBottom: 32 }}>
                  Whether you&apos;re a student, partner, or college looking to join our network — reach out and we&apos;ll get back to you within 24 hours.
                </p>
              </div>

              <div className="pub-contact-item">
                <div className="pub-contact-icon">📧</div>
                <div>
                  <h3>Email Us</h3>
                  <p>support@myuniversitys.com</p>
                </div>
              </div>

              <div className="pub-contact-item">
                <div className="pub-contact-icon">📍</div>
                <div>
                  <h3>Our Office</h3>
                  <p>Chennai, Tamil Nadu, India</p>
                </div>
              </div>

              <div className="pub-contact-item">
                <div className="pub-contact-icon">⏰</div>
                <div>
                  <h3>Working Hours</h3>
                  <p>Mon – Sat, 9:00 AM – 6:00 PM IST</p>
                </div>
              </div>

              <div className="pub-contact-item">
                <div className="pub-contact-icon">📱</div>
                <div>
                  <h3>In-App Support</h3>
                  <p>Use the Help &amp; Support section in the app for fastest response.</p>
                </div>
              </div>
            </div>

            {/* Form */}
            <div>
              {submitted ? (
                <div style={{ textAlign: "center", padding: "60px 32px", background: "var(--pub-bg-alt)", borderRadius: 16, border: "1px solid var(--pub-border)" }}>
                  <div style={{ fontSize: "3rem", marginBottom: 16 }}>✅</div>
                  <h3 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: 8 }}>Message Sent!</h3>
                  <p style={{ color: "var(--pub-text-secondary)" }}>Thank you for reaching out. We&apos;ll get back to you within 24 hours.</p>
                  <button className="pub-btn pub-btn--dark" style={{ marginTop: 24 }} onClick={() => setSubmitted(false)}>Send Another Message</button>
                </div>
              ) : (
                <form className="pub-form" onSubmit={handleSubmit} style={{ background: "var(--pub-bg-alt)", padding: 32, borderRadius: 16, border: "1px solid var(--pub-border)" }}>
                  <div className="pub-form-row">
                    <div className="pub-form-group">
                      <label className="pub-form-label">First Name</label>
                      <input className="pub-form-input" placeholder="John" required />
                    </div>
                    <div className="pub-form-group">
                      <label className="pub-form-label">Last Name</label>
                      <input className="pub-form-input" placeholder="Doe" required />
                    </div>
                  </div>
                  <div className="pub-form-group">
                    <label className="pub-form-label">Email</label>
                    <input className="pub-form-input" type="email" placeholder="john@example.com" required />
                  </div>
                  <div className="pub-form-group">
                    <label className="pub-form-label">Phone Number</label>
                    <input className="pub-form-input" type="tel" placeholder="+91 98765 43210" />
                  </div>
                  <div className="pub-form-group">
                    <label className="pub-form-label">I am a...</label>
                    <select className="pub-form-input" required defaultValue="">
                      <option value="" disabled>Select your role</option>
                      <option>Student looking for colleges</option>
                      <option>Partner interested in referrals</option>
                      <option>College wanting to join</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div className="pub-form-group">
                    <label className="pub-form-label">Message</label>
                    <textarea className="pub-form-textarea" placeholder="Tell us how we can help..." required />
                  </div>
                  <button type="submit" className="pub-btn pub-btn--dark pub-btn--lg" style={{ width: "100%" }}>
                    Send Message
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
