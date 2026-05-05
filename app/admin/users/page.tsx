"use client";

import React from "react";
import { getSupabaseClient } from "../../../lib/supabase/browser";

type UserRow = {
  id: string;
  name?: string;
  phone?: string;
  email?: string;
  kyc_verified?: boolean;
  partner_verified?: boolean;
  role?: string;
  created_at?: string;
};

export default function AdminUsersPage() {
  const [rows, setRows] = React.useState<UserRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const supabase = React.useMemo(() => getSupabaseClient(), []);

  async function loadUsers() {
    if (!supabase) { setError("Supabase is not configured."); setLoading(false); return; }
    setLoading(true); setError(null);
    const { data, error } = await supabase
      .from("users")
      .select("id, name, phone, email, kyc_verified, partner_verified, role, created_at")
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) { setError(error.message); setLoading(false); return; }
    setRows((data ?? []) as any);
    setLoading(false);
  }

  React.useEffect(() => { loadUsers(); }, [supabase]);

  async function toggleKyc(userId: string, current: boolean) {
    if (!supabase) return;
    const ok = window.confirm(`${current ? "Revoke" : "Approve"} KYC verification for this user?`);
    if (!ok) return;
    const { error } = await (supabase.from("users") as any).update({ kyc_verified: !current }).eq("id", userId);
    if (error) { setError(error.message); return; }
    await loadUsers();
  }

  async function togglePartner(userId: string, current: boolean) {
    if (!supabase) return;
    const ok = window.confirm(`${current ? "Revoke" : "Approve"} partner verification for this user?`);
    if (!ok) return;
    const { error } = await (supabase.from("users") as any).update({ partner_verified: !current }).eq("id", userId);
    if (error) { setError(error.message); return; }
    await loadUsers();
  }

  const filtered = rows.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (r.name?.toLowerCase().includes(q) || r.phone?.toLowerCase().includes(q) || r.email?.toLowerCase().includes(q));
  });

  const kycCount = rows.filter(r => r.kyc_verified).length;
  const partnerCount = rows.filter(r => r.partner_verified).length;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1>User Management</h1>
          <p>Manage KYC verification and partner access for all platform users.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-icon indigo">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <div className="stat-content">
            <div className="stat-label">Total Users</div>
            <div className="stat-value">{rows.length}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <div className="stat-content">
            <div className="stat-label">KYC Verified</div>
            <div className="stat-value green">{kycCount}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <div className="stat-content">
            <div className="stat-label">Partners</div>
            <div className="stat-value">{partnerCount}</div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="filter-card">
        <div className="input-group">
          <span className="input-label">Search Users</span>
          <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Filter by name, phone, or email..." className="input-field" />
        </div>
      </div>

      {error && <div className="state-error" style={{ marginBottom: 16 }}>{error}</div>}

      {/* Table */}
      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Contact</th>
                <th>Role</th>
                <th>KYC</th>
                <th>Partner</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="state-loading">Loading users...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="state-empty">No users found.</td></tr>
              ) : (
                filtered.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: "var(--text-main)" }}>{row.name || "—"}</div>
                      <div className="mono" style={{ fontSize: "0.65rem", marginTop: 2 }}>{row.id.slice(0, 8)}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: "0.85rem" }}>{row.phone || "—"}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-light)" }}>{row.email || "—"}</div>
                    </td>
                    <td><span className="badge badge-neutral">{row.role || "user"}</span></td>
                    <td>
                      <span className={`badge ${row.kyc_verified ? "badge-success" : "badge-warning"}`}>
                        {row.kyc_verified ? "Verified" : "Pending"}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${row.partner_verified ? "badge-purple" : "badge-neutral"}`}>
                        {row.partner_verified ? "Partner" : "Standard"}
                      </span>
                    </td>
                    <td style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{row.created_at ? new Date(row.created_at).toLocaleDateString() : "—"}</td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => toggleKyc(row.id, !!row.kyc_verified)} className={`btn ${row.kyc_verified ? "btn-danger" : "btn-primary"}`} style={{ fontSize: "0.7rem", padding: "5px 10px" }}>
                          {row.kyc_verified ? "Revoke KYC" : "Approve KYC"}
                        </button>
                        <button onClick={() => togglePartner(row.id, !!row.partner_verified)} className={`btn ${row.partner_verified ? "btn-danger" : "btn-outline"}`} style={{ fontSize: "0.7rem", padding: "5px 10px" }}>
                          {row.partner_verified ? "Revoke" : "Make Partner"}
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
