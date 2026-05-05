import Link from "next/link";
import PublicShell from "../components/PublicShell";

export const metadata = {
  title: "Partner Colleges — MyUniversitys",
  description: "Browse 50+ partner colleges across India. Refer students and earn rewards for every successful admission.",
};

const colleges = [
  { name: "SRM Institute of Science & Technology", loc: "Chennai, Tamil Nadu", tags: ["Engineering", "Management", "Science"], reward: "₹5,000", color: "linear-gradient(135deg,#4f46e5,#7c3aed)", icon: "🏛️" },
  { name: "VIT University", loc: "Vellore, Tamil Nadu", tags: ["Engineering", "IT", "Design"], reward: "₹4,500", color: "linear-gradient(135deg,#059669,#10b981)", icon: "🎓" },
  { name: "Saveetha University", loc: "Chennai, Tamil Nadu", tags: ["Medical", "Dental", "Engineering"], reward: "₹6,000", color: "linear-gradient(135deg,#d97706,#f59e0b)", icon: "⚕️" },
  { name: "Sathyabama Institute", loc: "Chennai, Tamil Nadu", tags: ["Engineering", "Science", "Arts"], reward: "₹3,500", color: "linear-gradient(135deg,#e11d48,#f43f5e)", icon: "🔬" },
  { name: "Loyola College", loc: "Chennai, Tamil Nadu", tags: ["Arts", "Commerce", "Science"], reward: "₹3,000", color: "linear-gradient(135deg,#2563eb,#3b82f6)", icon: "📚" },
  { name: "Hindustan University", loc: "Chennai, Tamil Nadu", tags: ["Engineering", "Management", "Aviation"], reward: "₹4,000", color: "linear-gradient(135deg,#7c3aed,#a78bfa)", icon: "✈️" },
  { name: "Jain University", loc: "Bangalore, Karnataka", tags: ["Management", "Commerce", "Law"], reward: "₹4,500", color: "linear-gradient(135deg,#0891b2,#06b6d4)", icon: "⚖️" },
  { name: "Christ University", loc: "Bangalore, Karnataka", tags: ["Arts", "Science", "Management"], reward: "₹5,000", color: "linear-gradient(135deg,#dc2626,#ef4444)", icon: "🎭" },
  { name: "Amity University", loc: "Noida, Uttar Pradesh", tags: ["Engineering", "Law", "Media"], reward: "₹3,500", color: "linear-gradient(135deg,#4338ca,#6366f1)", icon: "🏢" },
];

export default function CollegesPage() {
  return (
    <PublicShell>
      <section className="pub-page-hero">
        <div className="pub-container">
          <h1>Partner Colleges</h1>
          <p>Explore our growing network of 50+ accredited colleges. Refer students and earn rewards for every admission.</p>
        </div>
      </section>

      <section className="pub-section">
        <div className="pub-container">
          <div className="pub-college-grid">
            {colleges.map((c, i) => (
              <div className="pub-college-card" key={i}>
                <div className="pub-college-banner" style={{ background: c.color }}>{c.icon}</div>
                <div className="pub-college-body">
                  <h3>{c.name}</h3>
                  <p className="pub-college-loc">📍 {c.loc}</p>
                  <div className="pub-college-tags">
                    {c.tags.map((t) => (<span className="pub-college-tag" key={t}>{t}</span>))}
                  </div>
                  <div className="pub-college-footer">
                    <span className="pub-college-reward">Reward: <strong>{c.reward}</strong> / admission</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 60 }}>
            <p style={{ fontSize: "1.1rem", color: "var(--pub-text-secondary)", marginBottom: 20 }}>
              And many more colleges available in the app...
            </p>
            <a href="#download" className="pub-btn pub-btn--dark pub-btn--lg">Download App to See All</a>
          </div>
        </div>
      </section>

      <section className="pub-cta" id="download">
        <div className="pub-container pub-cta-inner">
          <h2>Start Referring Today</h2>
          <p>Download the app to browse all colleges, submit referrals, and track your earnings.</p>
          <div className="pub-cta-actions">
            <a href="#" className="pub-btn pub-btn-primary pub-btn--lg">📱 Download the App</a>
            <Link href="/contact" className="pub-btn pub-btn-outline pub-btn--lg">Partner With Us</Link>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
