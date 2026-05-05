"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getSupabaseClient } from "../../../lib/supabase/browser";

type College = { id: string; name: string };
type Course = { id: string; name: string };

type ReferralRow = {
  id: string;
  status: string;
  referred_name: string;
  referred_phone: string;
  referred_email?: string | null;
  intake_year?: number | null;
  locked?: boolean | null;
  created_at: string;
  updated_at?: string | null;
  colleges?: { name?: string } | null;
  courses?: { name?: string } | null;
};

type LeadHistoryRow = {
  id: string;
  referral_id: string;
  status: string;
  changed_by?: string | null;
  timestamp: string;
  users?: { name?: string } | null;
};

const referralStatuses = [
  "submitted",
  "contacted",
  "kyc",
  "verified",
  "applied_application",
  "fees_paid",
  "verified_by_college",
  "reward_allocated",
  "reward_approved",
  "paid",
  "rejected",
];

const validReferralTransitions: Record<string, string[]> = {
  submitted: ["verified", "rejected"],
  contacted: ["verified", "rejected"],
  kyc: ["verified", "rejected"],
  verified: ["applied_application", "rejected"],
  applied_application: ["fees_paid", "rejected"],
  fees_paid: ["verified_by_college", "rejected"],
  verified_by_college: ["reward_allocated", "reward_approved", "rejected"],
  reward_allocated: ["reward_approved", "paid", "rejected"],
  reward_approved: ["reward_allocated", "paid", "rejected"],
  paid: [],
  rejected: [],
};

function allowedNextStatuses(current: string) {
  const next = validReferralTransitions[current] ?? [];
  return Array.from(new Set([current, ...next]));
}

function toCsvValue(v: unknown) {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function downloadCsv(filename: string, header: string[], rows: any[]) {
  const body = rows.map((r) => header.map((h) => toCsvValue(r[h])).join(",")).join("\n");
  const csv = `${header.join(",")}\n${body}\n`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const statusColors: Record<string, { bg: string; border: string }> = {
  submitted: { bg: "#f1f5f9", border: "#cbd5e1" },
  contacted: { bg: "#fff7ed", border: "#fed7aa" },
  kyc: { bg: "#f3e8ff", border: "#e9d5ff" },
  verified: { bg: "#eff6ff", border: "#bfdbfe" },
  applied_application: { bg: "#eef2ff", border: "#c7d2fe" },
  fees_paid: { bg: "#fffbeb", border: "#fde68a" },
  verified_by_college: { bg: "#fefce8", border: "#fef08a" },
  reward_allocated: { bg: "#f0fdf4", border: "#bbf7d0" },
  reward_approved: { bg: "#dcfce7", border: "#86efac" },
  paid: { bg: "#bbf7d0", border: "#4ade80" },
  rejected: { bg: "#fef2f2", border: "#fecaca" },
};

function AdminReferralsContent() {
  const searchParams = useSearchParams();
  const searchParam = searchParams.get("search");
  const statusParam = searchParams.get("status");

  const [rows, setRows] = React.useState<ReferralRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [activeTab, setActiveTab] = React.useState<string>(statusParam || "submitted");
  const [searchQuery, setSearchQuery] = React.useState<string>(searchParam || "");
  const [collegeId, setCollegeId] = React.useState<string>("all");
  const [courseId, setCourseId] = React.useState<string>("all");
  const [fromDate, setFromDate] = React.useState<string>("");
  const [toDate, setToDate] = React.useState<string>("");

  const [colleges, setColleges] = React.useState<College[]>([]);
  const [courses, setCourses] = React.useState<Course[]>([]);
  const [historyOpen, setHistoryOpen] = React.useState(false);
  const [historyLoading, setHistoryLoading] = React.useState(false);
  const [historyRows, setHistoryRows] = React.useState<LeadHistoryRow[]>([]);
  const [historyError, setHistoryError] = React.useState<string | null>(null);

  const supabase = React.useMemo(() => getSupabaseClient() as any, []);

  async function loadColleges() {
    if (!supabase) return;
    const { data, error } = await supabase.from("colleges").select("id, name").order("name", { ascending: true });
    if (error) throw error;
    setColleges((data ?? []) as any);
  }

  async function loadCoursesForCollege(cid: string) {
    if (!supabase) return;
    if (cid === "all") {
      setCourses([]);
      return;
    }
    const { data, error } = await supabase.from("courses").select("id, name").eq("college_id", cid).order("name", { ascending: true });
    if (error) throw error;
    setCourses((data ?? []) as any);
  }

  async function loadReferrals() {
    if (!supabase) {
      setError("Supabase is not configured.");
      setLoading(false); return;
    }

    setLoading(true); setError(null);

    let query = supabase
      .from("referrals")
      .select("*, colleges(name), courses(name)")
      .order("created_at", { ascending: false })
      .limit(500);

    if (collegeId !== "all") query = query.eq("college_id", collegeId);
    if (courseId !== "all") query = query.eq("course_id", courseId);
    if (fromDate) query = query.gte("created_at", `${fromDate}T00:00:00.000Z`);
    if (toDate) query = query.lte("created_at", `${toDate}T23:59:59.999Z`);
    
    if (searchQuery.trim()) {
      const q = `%${searchQuery.trim()}%`;
      query = query.or(`referred_name.ilike.${q},referred_phone.ilike.${q},referred_email.ilike.${q}`);
    }

    const { data, error } = await query;
    if (error) throw error;
    setRows((data ?? []) as any);
    setLoading(false);
  }

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!supabase) return;
        await loadColleges();
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? String(e));
      }
    })();
    return () => { cancelled = true; };
  }, [supabase]);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadCoursesForCollege(collegeId);
        if (!cancelled) setCourseId("all");
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? String(e));
      }
    })();
    return () => { cancelled = true; };
  }, [collegeId]);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!cancelled) await loadReferrals();
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? String(e));
      }
    })();
    return () => { cancelled = true; };
  }, [searchQuery, collegeId, courseId, fromDate, toDate, supabase]);

  function highRiskWarning(currentStatus: string, nextStatus: string) {
    const leavingReward =
      (currentStatus === "reward_allocated" || currentStatus === "reward_approved") &&
      nextStatus !== "reward_allocated" && nextStatus !== "reward_approved" && nextStatus !== "paid";
    if (nextStatus === "reward_allocated" || nextStatus === "reward_approved") {
      return "This will credit wallet/invoices via DB triggers and notify the user.";
    }
    if (nextStatus === "paid") {
      return "This will finalize the payout flow for this referral (notifications may be triggered).";
    }
    if (leavingReward) {
      return "This will reverse wallet/invoice credits for this referral (invoices may be deleted) via DB triggers.";
    }
    return "";
  }

  async function updateStatus(referralId: string, currentStatus: string, nextStatus: string) {
    if (!supabase) return;
    const warning = highRiskWarning(currentStatus, nextStatus);
    const msg = warning 
      ? `Move referral to "${nextStatus.replace(/_/g, " ")}"?\n\nWARNING: ${warning}` 
      : `Move referral to "${nextStatus.replace(/_/g, " ")}"?`;
    
    const ok = window.confirm(msg);
    if (!ok) return;

    setLoading(true); setError(null);
    const { error } = await supabase.from("referrals").update({ status: nextStatus }).eq("id", referralId);
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    
    // Automatically switch active tab to the new status to follow the lead
    setActiveTab(nextStatus);
    await loadReferrals();
  }

  async function loadHistory(referralId: string) {
    if (!supabase) return;
    setHistoryOpen(true);
    setHistoryLoading(true); setHistoryError(null);
    try {
      const { data, error } = await supabase.from("lead_status_history")
        .select("*, users(name)")
        .eq("referral_id", referralId)
        .order("timestamp", { ascending: true }).limit(200);
      if (error) throw error;
      setHistoryRows((data ?? []) as any);
    } catch (e: any) {
      setHistoryError(e?.message ?? String(e));
    } finally {
      setHistoryLoading(false);
    }
  }

  async function exportCsv() {
    if (!supabase) return;
    const ok = window.confirm("Export referral data to CSV using the current filters?\nThis may fetch up to 5000 rows.");
    if (!ok) return;

    setError(null);
    let query = supabase.from("referrals").select("* , colleges(name), courses(name)").order("created_at", { ascending: false }).limit(5000);

    // Apply the exact same filters for export
    if (collegeId !== "all") query = query.eq("college_id", collegeId);
    if (courseId !== "all") query = query.eq("course_id", courseId);
    if (fromDate) query = query.gte("created_at", `${fromDate}T00:00:00.000Z`);
    if (toDate) query = query.lte("created_at", `${toDate}T23:59:59.999Z`);
    if (searchQuery.trim()) {
      const q = `%${searchQuery.trim()}%`;
      query = query.or(`referred_name.ilike.${q},referred_phone.ilike.${q},referred_email.ilike.${q}`);
    }

    const { data, error } = await query;
    if (error) { setError(error.message); return; }

    const header = [
      "id", "status", "referred_name", "referred_phone", "referred_email", 
      "college", "course", "intake_year", "locked", "created_at", "updated_at"
    ];

    const mapped = (data ?? []).map((r: any) => ({
      ...r,
      college: r.colleges?.name ?? "",
      course: r.courses?.name ?? "",
      referred_email: r.referred_email ?? "",
      updated_at: r.updated_at ?? ""
    }));

    downloadCsv(`referrals_export.csv`, header, mapped);
  }

  // Calculate counts for each tab
  const tabCounts = referralStatuses.reduce((acc, status) => {
    acc[status] = rows.filter(r => r.status === status).length;
    return acc;
  }, {} as Record<string, number>);

  const activeRows = rows.filter((r) => r.status === activeTab);

  React.useEffect(() => {
    if (searchParam && rows.length > 0) {
      const found = rows.find(r => r.id === searchParam || r.referred_phone === searchParam);
      if (found && found.status !== activeTab) {
        setActiveTab(found.status);
      }
    }
  }, [rows, searchParam]);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1>Referral Pipelines</h1>
          <p>Select a status group below to view and manage full application details.</p>
        </div>
        <div className="page-header-actions">
          <button onClick={exportCsv} className="btn btn-outline">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export CSV
          </button>
        </div>
      </div>

      {/* FILTERS */}
      <div className="filter-card">
        <div className="filter-grid">
          <div className="input-group">
            <span className="input-label">Find Student</span>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Name, Phone, or Email..."
              className="input-field"
            />
          </div>

          <div className="input-group">
            <span className="input-label">College Filter</span>
            <select value={collegeId} onChange={(e) => setCollegeId(e.target.value)} className="input-field">
              <option value="all">Every College</option>
              {colleges.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="input-group">
            <span className="input-label">Course Filter</span>
            <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className="input-field" disabled={collegeId === "all"}>
              <option value="all">Every Course</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="input-group">
            <span className="input-label">Date Range</span>
            <div style={{ display: "flex", gap: 8 }}>
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="input-field" />
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="input-field" />
            </div>
          </div>
        </div>
      </div>

      {loading && <div className="badge badge-info" style={{ marginBottom: 16 }}>Fetching Data...</div>}
      {error && <div className="state-error" style={{ marginBottom: 16 }}>{error}</div>}

      {/* STATUS TABS */}
      <div className="status-tabs">
        {referralStatuses.map((status) => {
          const isActive = activeTab === status;
          return (
            <button
              key={status}
              onClick={() => setActiveTab(status)}
              className={`status-tab ${isActive ? "active" : ""}`}
            >
              <span style={{ textTransform: "capitalize" }}>{status.replace(/_/g, " ")}</span>
              <span className="status-tab-count">{tabCounts[status]}</span>
            </button>
          );
        })}
      </div>

      {/* ACTIVE TAB CONTENT */}
      <div>
        <h2 style={{ textTransform: "capitalize", marginBottom: 20, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 12, fontSize: "1.1rem" }}>
          {activeTab.replace(/_/g, " ")} Group
          <span style={{ fontSize: "0.85rem", fontWeight: 400, color: "var(--text-light)" }}>({activeRows.length} Applications)</span>
        </h2>
        
        {activeRows.length === 0 ? (
          <div className="card" style={{ padding: 60, textAlign: "center", color: "var(--text-muted)" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: 12, opacity: 0.5 }}>📂</div>
            <h3 style={{ fontWeight: 600, marginBottom: 4 }}>No referrals in this group</h3>
            <p>Try adjusting your search filters or check another status tab.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 16 }}>
            {activeRows.map((row) => (
              <div 
                key={row.id} 
                className="card"
                style={{ 
                  display: "flex", 
                  flexDirection: "column",
                  borderTop: `3px solid ${statusColors[activeTab]?.border || "#cbd5e1"}`
                }}
              >
                <div style={{ padding: 20, flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                    <div>
                      <h3 style={{ margin: "0 0 3px 0", fontSize: "1rem", fontWeight: 700, color: "var(--text-main)" }}>{row.referred_name}</h3>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-light)" }}>Added: {new Date(row.created_at).toLocaleDateString()}</div>
                    </div>
                    <span className="badge" style={{ background: statusColors[activeTab]?.bg, color: "var(--text-secondary)", height: "fit-content", borderColor: statusColors[activeTab]?.border }}>
                      {activeTab.replace(/_/g, " ")}
                    </span>
                  </div>
                  
                  <div style={{ display: "grid", gap: 8, marginBottom: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.875rem" }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-light)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                      <a href={`tel:${row.referred_phone}`} style={{ color: "var(--primary-600)", fontWeight: 500 }}>{row.referred_phone}</a>
                    </div>
                    {row.referred_email && (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.875rem" }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-light)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                        <span className="mono">{row.referred_email}</span>
                      </div>
                    )}
                  </div>

                  <div style={{ background: "var(--bg-color)", padding: 14, borderRadius: "var(--radius-md)", border: "1px solid var(--border-light)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, fontSize: "0.85rem" }}>
                      <span style={{ color: "var(--text-light)" }}>🏫</span>
                      <span style={{ fontWeight: 600, color: "var(--text-secondary)" }}>{row.colleges?.name || "Undeclared College"}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem" }}>
                      <span style={{ color: "var(--text-light)" }}>🎓</span>
                      <span style={{ color: "var(--text-muted)" }}>{row.courses?.name || "Undeclared Course"}</span>
                    </div>
                  </div>
                </div>
                
                <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border-light)", background: "var(--bg-color)" }}>
                  <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: "var(--text-light)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Update Status
                  </label>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <div style={{ flex: 1 }}>
                      <StatusChanger current={row.status} referralId={row.id} onSave={(next) => updateStatus(row.id, row.status, next)} />
                    </div>
                    <button onClick={() => loadHistory(row.id)} className="btn btn-outline" style={{ padding: "8px 14px" }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      History
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* HISTORY MODAL */}
      {historyOpen && (
        <div className="modal-backdrop" onClick={() => setHistoryOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ margin: 0, fontSize: "1.1rem" }}>Status Audit Trail</h2>
              <button onClick={() => setHistoryOpen(false)} className="btn btn-ghost">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div className="modal-body">
              {historyLoading ? (
                <div className="state-loading">Fetching Audit Logs...</div>
              ) : historyError ? (
                <div className="state-error" style={{ margin: 16 }}>{historyError}</div>
              ) : (
                <div className="table-container" style={{ maxHeight: "60vh" }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>Group</th>
                        <th>Approver</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyRows.map((hr) => (
                        <tr key={hr.id}>
                          <td>{hr.timestamp ? new Date(hr.timestamp).toLocaleString() : "-"}</td>
                          <td><span className="badge" style={{ background: statusColors[hr.status]?.bg || "#f1f5f9", color: "var(--text-secondary)", borderColor: statusColors[hr.status]?.border }}>{hr.status.replace(/_/g, " ")}</span></td>
                          <td><span className="mono">{hr.users?.name ?? hr.changed_by ?? "System Trigger"}</span></td>
                        </tr>
                      ))}
                      {historyRows.length === 0 && (
                        <tr><td colSpan={3} className="state-empty">No history logs exist.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminReferralsPage() {
  return (
    <Suspense fallback={<div className="state-loading">Loading referrals...</div>}>
      <AdminReferralsContent />
    </Suspense>
  );
}

function StatusChanger({ current, referralId, onSave }: { current: string; referralId: string; onSave: (nextStatus: string) => void }) {
  const allowed = allowedNextStatuses(current).filter(s => s !== current);

  if (allowed.length === 0) {
    return <div style={{ fontSize: "0.8rem", color: "var(--status-success-text)", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
      ✅ Pipeline Complete
    </div>;
  }

  return (
    <select 
      className="input-field" 
      style={{ padding: "8px 12px", fontSize: "0.8rem", cursor: "pointer" }}
      onChange={(e) => {
        const val = e.target.value;
        if (val !== "") {
          onSave(val);
          e.target.value = ""; // reset UI manually
        }
      }}
      defaultValue=""
    >
      <option value="" disabled>Select next group...</option>
      {allowed.map((s) => (
        <option key={s} value={s}>Move to {s.replace(/_/g, " ")}</option>
      ))}
    </select>
  );
}
