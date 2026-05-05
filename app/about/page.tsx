import PublicShell from "../components/PublicShell";

export const metadata = {
  title: "About Us — MyUniversitys",
  description: "Learn about MyUniversitys, India's leading education referral platform connecting partners, students, and colleges.",
};

export default function AboutPage() {
  return (
    <PublicShell>
      <section className="pub-page-hero">
        <div className="pub-container">
          <h1>About MyUniversitys</h1>
          <p>We&apos;re on a mission to make quality education accessible by rewarding those who guide students to the right colleges.</p>
        </div>
      </section>

      <section className="pub-section">
        <div className="pub-container">
          <div className="pub-about-grid">
            <div className="pub-about-content">
              <h2>Our Story</h2>
              <p>MyUniversitys was born from a simple idea: the people best positioned to guide students toward higher education are those already in their communities — teachers, mentors, alumni, and local leaders.</p>
              <p>We built a platform that empowers these everyday influencers to become education partners, connecting aspiring students with top colleges across India while earning meaningful rewards for every successful admission.</p>
              <p>Today, we work with 50+ colleges, have 5,000+ active partners, and have helped thousands of students find their path to higher education.</p>
            </div>
            <div className="pub-about-image">🎓</div>
          </div>
        </div>
      </section>

      <section className="pub-section pub-section--alt">
        <div className="pub-container">
          <div className="pub-section-header">
            <p className="pub-overline">What We Stand For</p>
            <h2>Our Core Values</h2>
            <p>The principles that guide everything we do at MyUniversitys.</p>
          </div>
          <div className="pub-values">
            <div className="pub-value">
              <div className="pub-value-icon">🤝</div>
              <h3>Trust &amp; Transparency</h3>
              <p>Every referral is tracked in real-time. Partners always know exactly where things stand and when they&apos;ll get paid.</p>
            </div>
            <div className="pub-value">
              <div className="pub-value-icon">🎯</div>
              <h3>Student First</h3>
              <p>We only partner with accredited, quality institutions. Every referral should lead to a genuinely good education.</p>
            </div>
            <div className="pub-value">
              <div className="pub-value-icon">🚀</div>
              <h3>Empowerment</h3>
              <p>We give partners the tools, knowledge, and financial incentive to make a real difference in students&apos; lives.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="pub-section pub-section--dark">
        <div className="pub-container">
          <div className="pub-section-header">
            <p className="pub-overline">Our Impact</p>
            <h2>Making Education Accessible</h2>
          </div>
          <div className="pub-stats">
            <div className="pub-stat"><div className="pub-stat-value">50+</div><div className="pub-stat-label">Partner Colleges</div></div>
            <div className="pub-stat"><div className="pub-stat-value">5,000+</div><div className="pub-stat-label">Active Partners</div></div>
            <div className="pub-stat"><div className="pub-stat-value">15,000+</div><div className="pub-stat-label">Students Placed</div></div>
            <div className="pub-stat"><div className="pub-stat-value">₹2Cr+</div><div className="pub-stat-label">Rewards Paid</div></div>
          </div>
        </div>
      </section>

      <section className="pub-cta" id="download">
        <div className="pub-container pub-cta-inner">
          <h2>Join Our Mission</h2>
          <p>Become a partner today and help shape the future of education in India.</p>
          <div className="pub-cta-actions">
            <a href="#" className="pub-btn pub-btn-primary pub-btn--lg">📱 Download the App</a>
            <a href="/contact" className="pub-btn pub-btn-outline pub-btn--lg">Get in Touch</a>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
