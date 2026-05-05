"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getSupabaseClient } from "../../../lib/supabase/browser";
import { downloadCsv } from "../../../lib/csv";

type FollowUp = {
  id: string;
  referral_id: string;
  scheduled_at: string;
  notes?: string | null;
  status: string;
  created_at?: string | null;
  updated_at?: string | null;
  referrals?: { referred_name?: string | null; colleges?: { name?: string } | null } | null;
};

function AdminFollowUpsContent() {
  const searchParams = useSearchParams();
  const idFromUrl = searchParams.get("id");

  const supabase = React.useMemo(() => getSupabaseClient() as any, []);

  const [referralId, setReferralId] = React.useState<string>(idFromUrl || "");
  const [status, setStatus] = React.useState<string>("all");
  const [rows, setRows] = React.useState<FollowUp[]>([]);
  const [newReferrals, setNewReferrals] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  async function load() {
    if (!supabase) throw new Error("Supabase is not configured.");
    setLoading(true);
    setError(null);

    let query = supabase
      .from("follow_ups")
      .select("*, referrals(referrer_id,referred_name, colleges(name))")
      .order("scheduled_at", { ascending: true })
      .limit(200);

    if (referralId.trim()) query = query.eq("referral_id", referralId.trim());
    if (status !== "all") query = query.eq("status", status);

    const [followUpsRes, referralsRes] = await Promise.all([
      query,
      supabase
        .from("referrals")
        .select("*, colleges(name), courses(name)")
        .eq("status", "submitted")
        .order("created_at", { ascending: false })
    ]);

    if (followUpsRes.error) throw followUpsRes.error;
    if (referralsRes.error) throw referralsRes.error;

    setRows((followUpsRes.data ?? []) as any);
    setNewReferrals(referralsRes.data ?? []);
    setLoading(false);
  }

  React.useEffect(() => {
    load().catch((e: any) => {
      setError(e?.message ?? String(e));
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [referralId, status, supabase]);

  async function updateFollowUp(f: FollowUp, nextStatus: string) {
    if (!supabase) return;

    const ok = window.confirm(`Update follow-up ${f.id} to "${nextStatus}"?`);
    if (!ok) return;

    const notes =
      window.prompt("Notes (optional):", f.notes ?? "") ?? (f.notes ?? "");

    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase
        .from("follow_ups")
        .update({
          status: nextStatus,
          notes: notes.trim() ? notes.trim() : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", f.id);
      if (error) throw error;
      await load();
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  async function markReferralContacted(id: string) {
    if (!supabase) return;
    const ok = window.confirm(`Mark referral ${id} as contacted?`);
    if (!ok) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("referrals")
        .update({ status: "verified", updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      await load();
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  async function exportCsv() {
    if (!supabase) return;
    const ok = window.confirm("Export follow-ups to CSV using current filters? (May fetch up to 5000 rows)");
    if (!ok) return;

    setError(null);
    let query = supabase
      .from("follow_ups")
      .select("*, referrals(referrer_id,referred_name, colleges(name))")
      .order("scheduled_at", { ascending: true })
      .limit(5000);

    if (referralId.trim()) query = query.eq("referral_id", referralId.trim());
    if (status !== "all") query = query.eq("status", status);

    const { data, error } = await query;
    if (error) {
      setError(error.message);
      return;
    }

    const header = [
      "id", "referral_id", "scheduled_at", "notes", "status", "created_at", "updated_at",
      "referred_name", "college_name"
    ];

    const mapped = (data ?? []).map((r: any) => ({
      id: r.id, 
      referral_id: r.referral_id, 
      scheduled_at: r.scheduled_at ?? "", 
      notes: r.notes ?? "", 
      status: r.status, 
      created_at: r.created_at ?? "", 
      updated_at: r.updated_at ?? "",
      referred_name: r.referrals?.referred_name ?? "", 
      college_name: r.referrals?.colleges?.name ?? ""
    }));

    downloadCsv(`followups_export_${new Date().toISOString().slice(0,10)}.csv`, header, mapped);
  }

  const statuses = ["pending", "completed", "overdue"];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1>Follow-ups & Inbox</h1>
          <p>Handle new referrals and scheduled reminders.</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={exportCsv}
          disabled={loading}
        >
          ⬇ Export CSV
        </button>
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "end", flexWrap: "wrap", marginBottom: 24 }}>
        <div className="input-group">
          <span className="input-label">Referral ID (optional)</span>
          <input
            className="input-field"
            value={referralId}
            onChange={(e) => setReferralId(e.target.value)}
            placeholder="uuid..."
          />
        </div>

        <div className="input-group">
          <span className="input-label">Follow-up Status</span>
          <select
            className="input-field"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="all">all</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? <div className="state-loading">Loading...</div> : null}
      {error ? (
        <div className="state-error" style={{ marginBottom: 24 }}>
          <span>{error}</span>
        </div>
      ) : null}

      {!loading && !error && newReferrals.length > 0 ? (
        <div className="card" style={{ marginBottom: 32 }}>
          <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border-color)", background: "var(--primary-50)" }}>
            <h2 style={{ fontSize: "1.1rem", margin: 0, color: "var(--primary-700)" }}>New Referrals Inbox</h2>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--primary-600)" }}>These referrals were just submitted and need initial contact.</p>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Referral ID</th>
                  <th>Student Name</th>
                  <th>Phone</th>
                  <th>College</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {newReferrals.map((r) => (
                  <tr key={r.id}>
                    <td><span className="mono">{r.id.split('-')[0]}</span></td>
                    <td style={{ fontWeight: 500 }}>{r.referred_name}</td>
                    <td>{r.referred_phone}</td>
                    <td>{r.colleges?.name ?? "-"}</td>
                    <td>{new Date(r.created_at).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}</td>
                    <td>
                      <button 
                        onClick={() => markReferralContacted(r.id)}
                        className="btn btn-primary" 
                        style={{ fontSize: "12px", padding: "6px 10px" }}
                      >
                        Verify & Contacted
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {!loading && !error ? (
        <div className="card">
          <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border-color)" }}>
            <h2 style={{ fontSize: "1.1rem", margin: 0 }}>Scheduled Follow-ups</h2>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Referral ID</th>
                  <th>Student Name</th>
                  <th>Scheduled For</th>
                  <th>Status</th>
                  <th>Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((f) => (
                  <tr key={f.id}>
                    <td><span className="mono">{f.id.split('-')[0]}</span></td>
                    <td><span className="mono">{f.referral_id.split('-')[0]}</span></td>
                    <td style={{ fontWeight: 500 }}>{f.referrals?.referred_name ?? "-"}</td>
                    <td>{f.scheduled_at ? new Date(f.scheduled_at).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }) : "-"}</td>
                    <td>
                      <span className={`badge ${f.status === 'completed' ? 'badge-success' : f.status === 'overdue' ? 'badge-danger' : 'badge-warning'}`}>
                        {f.status}
                      </span>
                    </td>
                    <td style={{ maxWidth: 200, whiteSpace: "normal" }}>{f.notes ?? "-"}</td>
                    <td>
                      <div style={{ display: "flex", gap: 8 }}>
                        {statuses
                          .filter((s) => s !== f.status)
                          .map((ns) => (
                            <button
                              key={ns}
                              onClick={() => updateFollowUp(f, ns)}
                              className="btn btn-outline"
                              style={{ fontSize: "12px", padding: "4px 8px" }}
                            >
                              {ns}
                            </button>
                          ))}
                      </div>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="state-empty">No scheduled follow-ups found.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function AdminFollowUpsPage() {
  return (
    <Suspense fallback={<div className="state-loading">Loading follow-ups...</div>}>
      <AdminFollowUpsContent />
    </Suspense>
  );
}

