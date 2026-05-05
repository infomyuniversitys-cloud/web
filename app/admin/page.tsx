"use client";

import React from "react";
import Link from "next/link";
import { getSupabaseClient } from "../../lib/supabase/browser";

type ReferralRow = {
  id: string;
  status: string;
  referred_name: string;
  referred_phone: string;
  created_at: string;
  colleges?: { name?: string } | null;
  courses?: { name?: string } | null;
};

type FollowUpRow = {
  id: string;
  referral_id: string;
  scheduled_at: string;
  notes?: string | null;
  status: string;
  referrals?: { referred_name?: string | null } | null;
};

const STATUS_CONFIG: Record<string, { label: string; icon: string }> = {
  submitted: { label: "Submitted", icon: "📥" },
  verified: { label: "Verified", icon: "✅" },
  applied_application: { label: "Applied", icon: "📄" },
  fees_paid: { label: "Fee Paid", icon: "💳" },
  verified_by_college: { label: "Verified (College)", icon: "🏛️" },
  reward_allocated: { label: "Reward Allocated", icon: "💰" },
  reward_approved: { label: "Reward Approved", icon: "💎" },
  paid: { label: "Paid", icon: "🚀" },
  rejected: { label: "Rejected", icon: "❌" },
};

function formatRelativeTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function AdminDashboardPage() {
  const [referrals, setReferrals] = React.useState<ReferralRow[]>([]);
  const [followUps, setFollowUps] = React.useState<FollowUpRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const supabase = React.useMemo(() => getSupabaseClient(), []);

  const fetchData = React.useCallback(async () => {
    if (!supabase) return;
    try {
      setLoading(true);
      setError(null);

      const [referralsRes, followUpsRes] = await Promise.all([
        supabase
          .from("referrals")
          .select("*, colleges(name), courses(name)")
          .order("created_at", { ascending: false }),
        supabase
          .from("follow_ups")
          .select("*, referrals(referred_name)")
          .in("status", ["pending", "overdue"])
          .order("scheduled_at", { ascending: true })
          .limit(10),
      ]);

      if (referralsRes.error) throw referralsRes.error;
      if (followUpsRes.error) throw followUpsRes.error;

      setReferrals((referralsRes.data ?? []) as any[]);
      setFollowUps((followUpsRes.data ?? []) as any[]);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const groupedReferrals = React.useMemo(() => {
    const groups: Record<string, ReferralRow[]> = {};
    Object.keys(STATUS_CONFIG).forEach((s) => (groups[s] = []));
    referrals.forEach((r) => {
      if (groups[r.status]) groups[r.status].push(r);
    });
    return groups;
  }, [referrals]);

  // Stats
  const totalReferrals = referrals.length;
  const pendingCount = referrals.filter(r => ["submitted", "verified", "applied_application"].includes(r.status)).length;
  const paidCount = referrals.filter(r => r.status === "paid").length;
  const rejectedCount = referrals.filter(r => r.status === "rejected").length;

  if (loading && referrals.length === 0) {
    return <div className="state-loading">Loading Pipeline...</div>;
  }

  return (
    <div className="animate-fade-in">
      {/* Greeting Banner */}
      <div className="greeting-banner">
        <div className="greeting-title">{getGreeting()}, Admin 👋</div>
        <div className="greeting-sub">Here&apos;s your referral pipeline overview for today.</div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon indigo">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <div className="stat-content">
            <div className="stat-label">Total Referrals</div>
            <div className="stat-value">{totalReferrals}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon amber">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div className="stat-content">
            <div className="stat-label">In Progress</div>
            <div className="stat-value amber">{pendingCount}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <div className="stat-content">
            <div className="stat-label">Completed</div>
            <div className="stat-value green">{paidCount}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon rose">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          </div>
          <div className="stat-content">
            <div className="stat-label">Rejected</div>
            <div className="stat-value rose">{rejectedCount}</div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
        <button onClick={fetchData} className="btn btn-outline">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
          Refresh
        </button>
      </div>

      {error ? (
        <div className="state-error" style={{ marginBottom: 24 }}>
          <span>{error}</span>
        </div>
      ) : null}

      {/* Follow-ups Section */}
      {followUps.length > 0 && (
        <section style={{ marginBottom: 40 }}>
          <div className="dash-section-header">
            <h2>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--status-warning-text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              Urgent Follow-ups
            </h2>
            <Link href="/admin/followups" className="btn btn-outline" style={{ fontSize: "0.75rem", padding: "6px 12px" }}>
              View All
            </Link>
          </div>
          <div className="kanban-grid">
            {followUps.map((f) => (
              <div key={f.id} className="kanban-card followup-alert-card">
                <div className="kanban-card-title">
                  {f.referrals?.referred_name ?? "Unknown Student"}
                </div>
                <div className="kanban-card-info">
                  <div className="kanban-card-detail">
                    <span className={`followup-badge followup-badge-${f.status}`}>
                      {f.status}
                    </span>
                    <span>Scheduled for {new Date(f.scheduled_at).toLocaleDateString()}</span>
                  </div>
                  {f.notes && (
                    <div className="kanban-card-detail" style={{ color: "var(--text-main)", fontWeight: 500 }}>
                      📝 {f.notes}
                    </div>
                  )}
                </div>
                <div className="kanban-card-footer">
                  <Link href={`/admin/followups?id=${f.referral_id}`} className="btn btn-primary" style={{ width: "100%", fontSize: "0.75rem", padding: "6px" }}>
                    Handle Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Pipeline Grid Section */}
      <section>
        <div className="dash-section-header">
          <h2>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary-500)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
            Referral Pipeline
          </h2>
        </div>
        <div className="kanban-grid">
          {Object.entries(STATUS_CONFIG).map(([statusKey, config]) => {
            const items = groupedReferrals[statusKey] || [];
            if (items.length === 0 && statusKey === "rejected") return null;

            return (
              <div key={statusKey} className="kanban-column">
                <div className="kanban-column-header">
                  <div className="kanban-column-title">
                    <span>{config.icon}</span>
                    {config.label}
                  </div>
                  <span className="kanban-column-count">{items.length}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {items.map((r) => (
                    <Link key={r.id} href={`/admin/referrals?search=${r.id}`} className="kanban-card" style={{ textDecoration: 'none' }}>
                      <div className="kanban-card-title">{r.referred_name}</div>
                      <div className="kanban-card-info">
                        <div className="kanban-card-detail">
                          🏛️ {r.colleges?.name || "No College"}
                        </div>
                        <div className="kanban-card-detail">
                          🎓 {r.courses?.name || "No Course"}
                        </div>
                      </div>
                      <div className="kanban-card-footer">
                        <span className="kanban-card-time">
                          {formatRelativeTime(r.created_at)}
                        </span>
                        <span className="mono" style={{ fontSize: '10px', padding: '1px 4px' }}>
                          #{r.id.split('-')[0]}
                        </span>
                      </div>
                    </Link>
                  ))}
                  {items.length === 0 && (
                    <div style={{ textAlign: "center", padding: "20px", color: "var(--text-light)", fontSize: "0.85rem", fontStyle: "italic" }}>
                      Empty
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
