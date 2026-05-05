import Link from "next/link";
import PublicShell from "./components/PublicShell";

export default function HomePage() {
  return (
    <PublicShell>
      {/* ── Hero ── */}
      <section className="pub-hero">
        <div className="pub-container pub-hero-inner">
          <div className="pub-hero-content">
            <div className="pub-hero-badge">🎓 India&apos;s #1 Education Referral Platform</div>
            <h1>
              Refer Students.<br />
              <span>Earn Rewards.</span>
            </h1>
            <p className="pub-hero-subtitle">
              Join thousands of partners who are helping students find their dream
              colleges — and earning real money for every successful admission.
            </p>
            <div className="pub-hero-actions">
              <a href="#download" className="pub-btn pub-btn-primary pub-btn--lg">
                Download App
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
              </a>
              <Link href="/about" className="pub-btn pub-btn-outline pub-btn--lg">
                Learn More
              </Link>
            </div>
          </div>
          <div className="pub-hero-visual">
            <div className="pub-hero-card">
              <div className="pub-hero-card-header">
                <div className="pub-hero-card-avatar">R</div>
                <div>
                  <div className="pub-hero-card-name">Rahul Kumar</div>
                  <div className="pub-hero-card-role">Gold Partner</div>
                </div>
              </div>
              <div className="pub-hero-card-stats">
                <div className="pub-hero-stat">
                  <span className="pub-hero-stat-label">Total Referrals</span>
                  <span className="pub-hero-stat-value">47</span>
                </div>
                <div className="pub-hero-stat">
                  <span className="pub-hero-stat-label">Earnings</span>
                  <span className="pub-hero-stat-value green">₹1,42,500</span>
                </div>
                <div className="pub-hero-stat">
                  <span className="pub-hero-stat-label">Success Rate</span>
                  <span className="pub-hero-stat-value">89%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="pub-section pub-section--alt">
        <div className="pub-container">
          <div className="pub-section-header">
            <p className="pub-overline">Simple Process</p>
            <h2>How It Works</h2>
            <p>Start earning in 4 simple steps. No investment needed — just your network.</p>
          </div>
          <div className="pub-steps">
            <div className="pub-step">
              <div className="pub-step-num">1</div>
              <h3>Sign Up Free</h3>
              <p>Download the app and create your partner account in under 2 minutes.</p>
            </div>
            <div className="pub-step">
              <div className="pub-step-num">2</div>
              <h3>Browse Colleges</h3>
              <p>Explore 50+ partner colleges and their courses, fees, and reward amounts.</p>
            </div>
            <div className="pub-step">
              <div className="pub-step-num">3</div>
              <h3>Refer Students</h3>
              <p>Submit student details through the app. We handle the rest of the process.</p>
            </div>
            <div className="pub-step">
              <div className="pub-step-num">4</div>
              <h3>Earn Rewards</h3>
              <p>Get paid for every successful admission. Withdraw directly to your bank.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="pub-section">
        <div className="pub-container">
          <div className="pub-section-header">
            <p className="pub-overline">Platform Features</p>
            <h2>Everything You Need to Succeed</h2>
            <p>Powerful tools to manage referrals, track earnings, and grow your network.</p>
          </div>
          <div className="pub-features">
            <div className="pub-feature">
              <div className="pub-feature-icon indigo">🎯</div>
              <h3>Smart Referral Tracking</h3>
              <p>Real-time status updates from submission to admission. Never lose track of a referral.</p>
            </div>
            <div className="pub-feature">
              <div className="pub-feature-icon green">💰</div>
              <h3>Instant Wallet Credits</h3>
              <p>Rewards are credited to your wallet automatically upon successful admission verification.</p>
            </div>
            <div className="pub-feature">
              <div className="pub-feature-icon amber">🏆</div>
              <h3>Milestone Bonuses</h3>
              <p>Unlock tiered bonuses as you reach referral milestones. The more you refer, the more you earn.</p>
            </div>
            <div className="pub-feature">
              <div className="pub-feature-icon purple">🏛️</div>
              <h3>50+ Partner Colleges</h3>
              <p>Browse our curated network of top-tier colleges across multiple states and disciplines.</p>
            </div>
            <div className="pub-feature">
              <div className="pub-feature-icon rose">🔒</div>
              <h3>Secure KYC &amp; Payments</h3>
              <p>Bank-grade security for your documents and direct bank transfers for withdrawals.</p>
            </div>
            <div className="pub-feature">
              <div className="pub-feature-icon blue">📊</div>
              <h3>Leaderboard &amp; Rankings</h3>
              <p>Compete with other partners, climb the leaderboard, and earn recognition for your efforts.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="pub-section pub-section--dark">
        <div className="pub-container">
          <div className="pub-section-header">
            <p className="pub-overline">Our Impact</p>
            <h2>Numbers That Speak</h2>
            <p>Growing every day with partners like you across India.</p>
          </div>
          <div className="pub-stats">
            <div className="pub-stat">
              <div className="pub-stat-value">5,000+</div>
              <div className="pub-stat-label">Active Partners</div>
            </div>
            <div className="pub-stat">
              <div className="pub-stat-value">50+</div>
              <div className="pub-stat-label">Partner Colleges</div>
            </div>
            <div className="pub-stat">
              <div className="pub-stat-value">₹2Cr+</div>
              <div className="pub-stat-label">Rewards Distributed</div>
            </div>
            <div className="pub-stat">
              <div className="pub-stat-value">15,000+</div>
              <div className="pub-stat-label">Successful Referrals</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="pub-section pub-section--dark" style={{ paddingTop: 0 }}>
        <div className="pub-container">
          <div className="pub-section-header">
            <p className="pub-overline">Partner Stories</p>
            <h2>What Our Partners Say</h2>
            <p>Real stories from real partners earning with MyUniversitys.</p>
          </div>
          <div className="pub-testimonials">
            <div className="pub-testimonial">
              <p className="pub-testimonial-text">
                &ldquo;I started as a college student myself. Now I earn ₹30,000+ every month just by referring students from my hometown. The app makes everything so easy!&rdquo;
              </p>
              <div className="pub-testimonial-author">
                <div className="pub-testimonial-avatar">A</div>
                <div>
                  <div className="pub-testimonial-name">Arun Prakash</div>
                  <div className="pub-testimonial-role">Partner since 2025</div>
                </div>
              </div>
            </div>
            <div className="pub-testimonial">
              <p className="pub-testimonial-text">
                &ldquo;The tracking system is brilliant. I can see exactly where each referral stands. Payments are always on time and directly to my bank account.&rdquo;
              </p>
              <div className="pub-testimonial-author">
                <div className="pub-testimonial-avatar">P</div>
                <div>
                  <div className="pub-testimonial-name">Priya Sharma</div>
                  <div className="pub-testimonial-role">Gold Partner</div>
                </div>
              </div>
            </div>
            <div className="pub-testimonial">
              <p className="pub-testimonial-text">
                &ldquo;As a retired teacher, I wanted something meaningful. MyUniversitys lets me help students find the right college while earning a steady side income.&rdquo;
              </p>
              <div className="pub-testimonial-author">
                <div className="pub-testimonial-avatar">K</div>
                <div>
                  <div className="pub-testimonial-name">Karthik Rajan</div>
                  <div className="pub-testimonial-role">Platinum Partner</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Download CTA ── */}
      <section className="pub-cta" id="download">
        <div className="pub-container pub-cta-inner">
          <h2>Ready to Start Earning?</h2>
          <p>Download the MyUniversitys app today and turn your network into income.</p>
          <div className="pub-cta-actions">
            <a href="#" className="pub-btn pub-btn-primary pub-btn--lg">
              Download for Android
            </a>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
