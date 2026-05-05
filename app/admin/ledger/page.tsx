"use client";

import React from "react";
import { getSupabaseClient } from "../../../lib/supabase/browser";

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

function formatCurrency(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminLedgerPage() {
  const supabase = React.useMemo(() => getSupabaseClient() as any, []);

  const [fromDate, setFromDate] = React.useState<string>("");
  const [toDate, setToDate] = React.useState<string>("");
  const [referrerId, setReferrerId] = React.useState<string>("");
  const [referralId, setReferralId] = React.useState<string>("");
  const [status, setStatus] = React.useState<string>("all");
  const [rows, setRows] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  async function load() {
    if (!supabase) throw new Error("Supabase is not configured.");
    setLoading(true);
    setError(null);
    let query = supabase
      .from("invoices")
      .select("id,user_id,referral_id,gross_amount,tds_amount,net_amount,description,invoice_url,created_at, users(name,phone), referrals(status,colleges(name),courses(name))")
      .order("created_at", { ascending: false })
      .limit(100);
    if (status !== "all") query = query.eq("referrals.status", status);
    if (referralId.trim()) query = query.eq("referral_id", referralId.trim());
    if (referrerId.trim()) query = query.eq("user_id", referrerId.trim());
    if (fromDate) query = query.gte("created_at", `${fromDate}T00:00:00.000Z`);
    if (toDate) query = query.lte("created_at", `${toDate}T23:59:59.999Z`);
    const { data, error } = await query;
    if (error) throw error;
    setRows((data ?? []) as any);
    setLoading(false);
  }

  React.useEffect(() => {
    load().catch((e: any) => { setError(e?.message ?? String(e)); setLoading(false); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromDate, toDate, referrerId, referralId, status, supabase]);

  async function exportCsv() {
    if (!supabase) return;
    if (!window.confirm("Export ledger to CSV?")) return;
    setError(null);
    let query = supabase
      .from("invoices")
      .select("id,user_id,referral_id,gross_amount,tds_amount,net_amount,description,invoice_url,created_at, users(name,phone), referrals(status,colleges(name),courses(name))")
      .order("created_at", { ascending: false })
      .limit(5000);
    if (status !== "all") query = query.eq("referrals.status", status);
    if (referralId.trim()) query = query.eq("referral_id", referralId.trim());
    if (referrerId.trim()) query = query.eq("user_id", referrerId.trim());
    if (fromDate) query = query.gte("created_at", `${fromDate}T00:00:00.000Z`);
    if (toDate) query = query.lte("created_at", `${toDate}T23:59:59.999Z`);
    const { data, error } = await query;
    if (error) { setError(error.message); return; }
    const header = ["invoice_id","user_id","user_name","user_phone","referral_id","referral_status","college","course","gross_amount","tds_amount","net_amount","description","invoice_url","created_at"];
    const mapped = (data ?? []).map((r: any) => ({
      invoice_id: r.id, user_id: r.user_id, user_name: r.users?.name ?? "", user_phone: r.users?.phone ?? "",
      referral_id: r.referral_id ?? "", referral_status: r.referrals?.status ?? "", college: r.referrals?.colleges?.name ?? "",
      course: r.referrals?.courses?.name ?? "", gross_amount: r.gross_amount, tds_amount: r.tds_amount,
      net_amount: r.net_amount, description: r.description ?? "", invoice_url: r.invoice_url ?? "", created_at: r.created_at,
    }));
    downloadCsv(`ledger_invoices_${new Date().toISOString().slice(0, 10)}.csv`, header, mapped);
  }

  const statuses = ["submitted","verified","applied_application","fees_paid","verified_by_college","reward_allocated","reward_approved","paid","rejected"];

  // Summary stats
  const totalGross = rows.reduce((s, r) => s + (r.gross_amount ?? 0), 0);
  const totalTds = rows.reduce((s, r) => s + (r.tds_amount ?? 0), 0);
  const totalNet = rows.reduce((s, r) => s + (r.net_amount ?? 0), 0);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1>Ledger (Invoices)</h1>
          <p>Financial records of referral reward payouts</p>
        </div>
        <button className="btn btn-outline" onClick={exportCsv} disabled={loading}>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Export CSV
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>Records</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 4 }}>{rows.length}</div>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>Gross Total</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 4, color: "var(--status-success-text)" }}>{formatCurrency(totalGross)}</div>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>TDS Deducted</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 4, color: "var(--status-warning-text)" }}>{formatCurrency(totalTds)}</div>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>Net Payable</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 4, color: "var(--primary-600)" }}>{formatCurrency(totalNet)}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: 20, marginBottom: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: "var(--text-muted)" }}>🔍 Filters</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
          <div className="input-group">
            <label className="input-label">Status</label>
            <select className="input-field" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">All statuses</option>
              {statuses.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">From Date</label>
            <input className="input-field" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>
          <div className="input-group">
            <label className="input-label">To Date</label>
            <input className="input-field" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
          <div className="input-group">
            <label className="input-label">Referrer ID</label>
            <input className="input-field" placeholder="uuid..." value={referrerId} onChange={(e) => setReferrerId(e.target.value)} />
          </div>
          <div className="input-group">
            <label className="input-label">Referral ID</label>
            <input className="input-field" placeholder="uuid..." value={referralId} onChange={(e) => setReferralId(e.target.value)} />
          </div>
        </div>
      </div>

      {error && <div className="state-error" style={{ marginBottom: 16 }}>⚠️ {error}</div>}

      {/* Table */}
      <div className="card">
        {loading ? (
          <div className="state-loading">Loading ledger...</div>
        ) : rows.length === 0 ? (
          <div className="state-empty">No invoices found for this filter.</div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>College</th>
                  <th>Course</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Gross</th>
                  <th style={{ textAlign: "right" }}>TDS</th>
                  <th style={{ textAlign: "right" }}>Net</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{r.users?.name ?? "-"}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{r.users?.phone ?? "-"}</div>
                    </td>
                    <td>{r.referrals?.colleges?.name ?? "-"}</td>
                    <td>{r.referrals?.courses?.name ?? "-"}</td>
                    <td><span className="badge badge-info">{r.referrals?.status ?? "-"}</span></td>
                    <td style={{ textAlign: "right", fontWeight: 600, color: "var(--status-success-text)" }}>{formatCurrency(r.gross_amount)}</td>
                    <td style={{ textAlign: "right", color: "var(--status-warning-text)" }}>{formatCurrency(r.tds_amount)}</td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>{formatCurrency(r.net_amount)}</td>
                    <td style={{ fontSize: 13, color: "var(--text-muted)" }}>{formatDate(r.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
