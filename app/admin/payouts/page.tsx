"use client";

import React from "react";
import { getSupabaseClient } from "../../../lib/supabase/browser";
import { downloadCsv } from "../../../lib/csv";

type PayoutRow = {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  bank_account_last4?: string | null;
  created_at: string;
  updated_at?: string | null;
  users?: { name?: string; phone?: string } | null;
};

export default function AdminPayoutsPage() {
  const [rows, setRows] = React.useState<PayoutRow[]>([]);
  const [statusFilter, setStatusFilter] = React.useState<string>("requested");
  const [fromDate, setFromDate] = React.useState<string>("");
  const [toDate, setToDate] = React.useState<string>("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const supabase = React.useMemo(() => getSupabaseClient() as any, []);

  async function loadPayouts() {
    if (!supabase) {
      setError("Supabase is not configured.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    let query = supabase
      .from("payouts")
      .select("*, users(name, phone)")
      .order("created_at", { ascending: false });

    if (statusFilter !== "all") query = query.eq("status", statusFilter);
    if (fromDate) query = query.gte("created_at", `${fromDate}T00:00:00.000Z`);
    if (toDate) query = query.lte("created_at", `${toDate}T23:59:59.999Z`);

    const { data, error } = await query.limit(100);
    if (error) throw error;

    setRows((data ?? []) as any);
    setLoading(false);
  }

  React.useEffect(() => {
    loadPayouts().catch((e: any) => {
      setError(e?.message ?? String(e));
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, fromDate, toDate, supabase]);

  async function decide(payout: PayoutRow, nextStatus: "processed" | "failed") {
    if (!supabase) return;
    const ok = window.confirm(
      `Set payout ${payout.id} to "${nextStatus}"?\nThis will notify the user.`
    );
    if (!ok) return;

    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase
        .from("payouts")
        .update({ status: nextStatus })
        .eq("id", payout.id);
      if (error) throw error;

      await loadPayouts();
    } catch (e: any) {
      setError(e?.message ?? String(e));
      setLoading(false);
    }
  }

  async function exportCsv() {
    if (!supabase) return;

    const ok = window.confirm(
      "Export payouts to CSV using current filters?\nThis may fetch up to 5000 rows."
    );
    if (!ok) return;

    setError(null);

    let query = supabase
      .from("payouts")
      .select("*, users(name, phone)")
      .order("created_at", { ascending: false })
      .limit(5000);

    if (statusFilter !== "all") query = query.eq("status", statusFilter);
    if (fromDate) query = query.gte("created_at", `${fromDate}T00:00:00.000Z`);
    if (toDate) query = query.lte("created_at", `${toDate}T23:59:59.999Z`);

    const { data, error } = await query;
    if (error) {
      setError(error.message);
      return;
    }

    const header = [
      "id", "user_id", "user_name", "user_phone", "amount",
      "status", "bank_account_last4", "created_at", "updated_at",
    ];

    const mapped = (data ?? []).map((r: any) => ({
      id: r.id, user_id: r.user_id, user_name: r.users?.name ?? "",
      user_phone: r.users?.phone ?? "", amount: r.amount, status: r.status,
      bank_account_last4: r.bank_account_last4 ?? "", created_at: r.created_at,
      updated_at: r.updated_at ?? "",
    }));

    downloadCsv(`payouts_${new Date().toISOString().slice(0, 10)}.csv`, header, mapped);
  }

  const totalAmount = rows.reduce((sum, r) => sum + Number(r.amount || 0), 0);
  const requestedCount = rows.filter(r => r.status === "requested").length;
  const processedCount = rows.filter(r => r.status === "processed").length;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1>Payouts</h1>
          <p>Process payout requests and track payment status.</p>
        </div>
        <div className="page-header-actions">
          <button onClick={exportCsv} className="btn btn-outline">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon indigo">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <div className="stat-content">
            <div className="stat-label">Total Amount</div>
            <div className="stat-value">₹{totalAmount.toLocaleString()}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon amber">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div className="stat-content">
            <div className="stat-label">Requested</div>
            <div className="stat-value amber">{requestedCount}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <div className="stat-content">
            <div className="stat-label">Processed</div>
            <div className="stat-value green">{processedCount}</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-card">
        <div className="filter-grid">
          <div className="input-group">
            <span className="input-label">Status</span>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field">
              <option value="all">All</option>
              <option value="requested">Requested</option>
              <option value="processed">Processed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <div className="input-group">
            <span className="input-label">From Date</span>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="input-field" />
          </div>
          <div className="input-group">
            <span className="input-label">To Date</span>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="input-field" />
          </div>
        </div>
      </div>

      {error && <div className="state-error" style={{ marginBottom: 16 }}>{error}</div>}

      {/* Table */}
      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Payout ID</th>
                <th>User</th>
                <th>Amount</th>
                <th>Account</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="state-loading">Loading payouts...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={7} className="state-empty">No payouts found for this filter.</td></tr>
              ) : (
                rows.map((p) => (
                  <tr key={p.id}>
                    <td><span className="mono">{p.id.slice(0, 8)}</span></td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.users?.name ?? "-"}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-light)" }}>{p.users?.phone ?? "-"}</div>
                    </td>
                    <td style={{ fontWeight: 700, color: "var(--text-main)" }}>₹{Number(p.amount).toLocaleString()}</td>
                    <td><span className="mono">{p.bank_account_last4 ? `****${p.bank_account_last4}` : "-"}</span></td>
                    <td>
                      <span className={`badge ${p.status === "processed" ? "badge-success" : p.status === "failed" ? "badge-danger" : "badge-warning"}`}>
                        {p.status}
                      </span>
                    </td>
                    <td style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{new Date(p.created_at).toLocaleString()}</td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          onClick={() => decide(p, "processed")}
                          disabled={p.status !== "requested"}
                          className="btn btn-primary"
                          style={{ fontSize: "0.7rem", padding: "5px 10px" }}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => decide(p, "failed")}
                          disabled={p.status !== "requested"}
                          className="btn btn-danger"
                          style={{ fontSize: "0.7rem", padding: "5px 10px" }}
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
