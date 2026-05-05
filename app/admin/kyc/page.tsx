"use client";

import React from "react";
import { getSupabaseClient } from "../../../lib/supabase/browser";
import { downloadCsv } from "../../../lib/csv";

type KycDoc = {
  id: string;
  user_id: string;
  document_type: string;
  document_number: string;
  image_url: string;
  status: string;
  rejection_reason?: string | null;
  created_at: string;
  updated_at?: string | null;
  users?: { name?: string; phone?: string } | null;
};

function getStoragePublicUrl(storageKey: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  if (!supabaseUrl || !storageKey) return "";
  // storageKey is the path/key stored in `image_url` (e.g. "pan_cards/<file>.jpg")
  return `${supabaseUrl}/storage/v1/object/public/kyc_docs/${storageKey}`;
}

export default function AdminKycPage() {
  const [docs, setDocs] = React.useState<KycDoc[]>([]);
  const [statusFilter, setStatusFilter] = React.useState<string>("pending");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const supabase = React.useMemo(() => getSupabaseClient() as any, []);

  async function loadDocs() {
    if (!supabase) {
      setError("Supabase is not configured.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    let query = supabase
      .from("kyc_documents")
      .select("*, users(name, phone)")
      .order("created_at", { ascending: false });

    if (statusFilter !== "all") query = query.eq("status", statusFilter);

    const { data, error } = await query.limit(100);
    if (error) throw error;
    setDocs((data ?? []) as any);
    setLoading(false);
  }

  React.useEffect(() => {
    loadDocs().catch((e: any) => {
      setError(e?.message ?? String(e));
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, supabase]);

  async function decide(doc: KycDoc, nextStatus: "verified" | "rejected") {
    if (!supabase) return;

    let rejectionReason: string | null = null;
    if (nextStatus === "rejected") {
      rejectionReason = window.prompt(
        "Rejection reason (required for rejected):",
        doc.rejection_reason ?? ""
      );
      if (!rejectionReason || !rejectionReason.trim()) {
        setError("Rejection reason is required for rejected KYC.");
        return;
      }
      rejectionReason = rejectionReason.trim();
    }

    const ok = window.confirm(
      `Set KYC doc ${doc.id} to "${nextStatus}"? This triggers notifications.`
    );
    if (!ok) return;

    setLoading(true);
    setError(null);
    try {
      const { error: docError } = await supabase
        .from("kyc_documents")
        .update({
          status: nextStatus,
          rejection_reason: nextStatus === "rejected" ? rejectionReason : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", doc.id);
      if (docError) throw docError;

      const { error: userError } = await supabase
        .from("users")
        .update({
          kyc_status: nextStatus,
        })
        .eq("id", doc.user_id);
      if (userError) throw userError;

      await loadDocs();
    } catch (e: any) {
      setError(e?.message ?? String(e));
      setLoading(false);
    }
  }

  async function exportCsv() {
    if (!supabase) return;
    const ok = window.confirm(
      "Export KYC documents to CSV using current filters?\nThis may fetch up to 5000 rows."
    );
    if (!ok) return;

    setError(null);

    let query = supabase
      .from("kyc_documents")
      .select("*, users(name, phone)")
      .order("created_at", { ascending: false })
      .limit(5000);

    if (statusFilter !== "all") query = query.eq("status", statusFilter);

    const { data, error } = await query;
    if (error) {
      setError(error.message);
      return;
    }

    const maskDoc = (docNumber: string) => {
      const s = String(docNumber ?? "");
      if (s.length <= 4) return s;
      return `****${s.slice(-4)}`;
    };

    const header = [
      "doc_id", "user_id", "user_name", "document_type",
      "document_number_masked", "status", "rejection_reason",
      "created_at", "updated_at",
    ];

    const mapped = (data ?? []).map((r: any) => ({
      doc_id: r.id, user_id: r.user_id, user_name: r.users?.name ?? "",
      document_type: r.document_type, document_number_masked: maskDoc(r.document_number),
      status: r.status, rejection_reason: r.rejection_reason ?? "",
      created_at: r.created_at, updated_at: r.updated_at ?? "",
    }));

    downloadCsv(`kyc_documents_${new Date().toISOString().slice(0, 10)}.csv`, header, mapped);
  }

  const pendingCount = docs.filter(d => d.status === "pending").length;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1>KYC Verification</h1>
          <p>Review and verify user identity documents.</p>
        </div>
        <div className="page-header-actions">
          <button onClick={exportCsv} className="btn btn-outline" disabled={loading}>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-card">
        <div className="filter-grid">
          <div className="input-group">
            <span className="input-label">Status Filter</span>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field">
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div className="stat-card" style={{ margin: 0 }}>
            <div className="stat-icon amber">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <div className="stat-content">
              <div className="stat-label">Pending Review</div>
              <div className="stat-value amber">{pendingCount}</div>
            </div>
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
                <th>Doc ID</th>
                <th>User</th>
                <th>Type</th>
                <th>Number</th>
                <th>Status</th>
                <th>Preview</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="state-loading">Loading KYC documents...</td></tr>
              ) : docs.length === 0 ? (
                <tr><td colSpan={7} className="state-empty">No KYC documents found for this filter.</td></tr>
              ) : (
                docs.map((d) => {
                  const src = getStoragePublicUrl(d.image_url);
                  return (
                    <tr key={d.id}>
                      <td><span className="mono">{d.id.slice(0, 8)}</span></td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{d.users?.name ?? "-"}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-light)" }}>{d.users?.phone ?? "-"}</div>
                      </td>
                      <td><span className="badge badge-info">{d.document_type}</span></td>
                      <td><span className="mono">{d.document_number}</span></td>
                      <td>
                        <span className={`badge ${d.status === "verified" ? "badge-success" : d.status === "rejected" ? "badge-danger" : "badge-warning"}`}>
                          {d.status}
                        </span>
                        {d.status === "rejected" && d.rejection_reason ? (
                          <div style={{ color: "var(--text-muted)", marginTop: 4, maxWidth: 220, fontSize: "0.75rem" }}>
                            {d.rejection_reason}
                          </div>
                        ) : null}
                      </td>
                      <td>
                        {src ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={src}
                            alt="KYC document"
                            style={{ width: 140, height: "auto", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", cursor: "pointer" }}
                            onClick={() => window.open(src, "_blank")}
                          />
                        ) : (
                          <span style={{ color: "var(--text-light)" }}>—</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => decide(d, "verified")} className="btn btn-primary" style={{ fontSize: "0.7rem", padding: "5px 10px" }}>
                            Approve
                          </button>
                          <button onClick={() => decide(d, "rejected")} className="btn btn-danger" style={{ fontSize: "0.7rem", padding: "5px 10px" }}>
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
