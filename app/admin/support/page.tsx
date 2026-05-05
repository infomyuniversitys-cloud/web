"use client";

import React from "react";
import { getSupabaseClient } from "../../../lib/supabase/browser";

type Ticket = {
  id: string;
  user_id: string;
  category: string;
  subject: string;
  message: string;
  status: string;
  admin_reply?: string | null;
  created_at: string;
  updated_at?: string | null;
  users?: { name?: string; phone?: string } | null;
};

function toCsvValue(v: unknown) {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function downloadCsv(filename: string, header: string[], rows: any[]) {
  const body = rows
    .map((r) => header.map((h) => toCsvValue(r[h])).join(","))
    .join("\n");
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

function statusBadge(status: string) {
  const map: Record<string, string> = {
    open: "badge badge-danger",
    in_progress: "badge badge-warning",
    resolved: "badge badge-success",
    closed: "badge badge-neutral",
  };
  return map[status] ?? "badge badge-info";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AdminSupportPage() {
  const supabase = React.useMemo(() => getSupabaseClient() as any, []);

  const [tickets, setTickets] = React.useState<Ticket[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<string>("all");
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  async function load() {
    if (!supabase) {
      setError("Supabase is not configured.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    let query = supabase
      .from("support_tickets")
      .select("*, users(name, phone)")
      .order("created_at", { ascending: false })
      .limit(100);
    if (status !== "all") query = query.eq("status", status);

    const { data, error: qError } = await query;
    if (qError) throw qError;
    setTickets((data ?? []) as any);
    setLoading(false);
  }

  React.useEffect(() => {
    load().catch((e: any) => {
      setError(e?.message ?? String(e));
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function updateTicket(ticket: Ticket, nextStatus: string) {
    if (!supabase) return;
    const ok = window.confirm(
      `Update ticket to "${nextStatus.replace("_", " ")}"?`
    );
    if (!ok) return;

    let admin_reply = ticket.admin_reply ?? "";
    if (nextStatus !== ticket.status) {
      const reply = window.prompt("Admin reply (optional):", admin_reply);
      if (reply !== null) admin_reply = reply.trim();
    }

    setLoading(true);
    setError(null);
    try {
      const { error: uError } = await supabase
        .from("support_tickets")
        .update({
          status: nextStatus,
          admin_reply: admin_reply || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", ticket.id);
      if (uError) throw uError;
      await load();
    } catch (e: any) {
      setError(e?.message ?? String(e));
      setLoading(false);
    }
  }

  async function exportCsv() {
    if (!supabase) return;
    const ok = window.confirm("Export support tickets to CSV?");
    if (!ok) return;
    setError(null);
    let query = supabase
      .from("support_tickets")
      .select("*, users(name, phone)")
      .order("created_at", { ascending: false })
      .limit(5000);
    if (status !== "all") query = query.eq("status", status);
    const { data, error } = await query;
    if (error) { setError(error.message); return; }
    const header = ["ticket_id","user_id","user_name","user_phone","category","subject","message","status","admin_reply","created_at","updated_at"];
    const mapped = (data ?? []).map((r: any) => ({
      ticket_id: r.id, user_id: r.user_id, user_name: r.users?.name ?? "", user_phone: r.users?.phone ?? "",
      category: r.category, subject: r.subject, message: r.message, status: r.status,
      admin_reply: r.admin_reply ?? "", created_at: r.created_at, updated_at: r.updated_at ?? "",
    }));
    downloadCsv(`support_tickets_${new Date().toISOString().slice(0, 10)}.csv`, header, mapped);
  }

  const statuses = ["open", "in_progress", "resolved", "closed"];
  const counts = {
    all: tickets.length,
    open: tickets.filter(t => t.status === "open").length,
    in_progress: tickets.filter(t => t.status === "in_progress").length,
    resolved: tickets.filter(t => t.status === "resolved").length,
    closed: tickets.filter(t => t.status === "closed").length,
  };

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>🎫 Support Tickets</h1>
          <p>Manage and respond to user support requests</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-outline" onClick={() => load().catch((e) => setError(e?.message ?? String(e)))}>
            ↻ Refresh
          </button>
          <button className="btn btn-primary" onClick={exportCsv} disabled={loading}>
            ⬇ Export CSV
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 24 }}>
        {(["all", ...statuses] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className="card"
            style={{
              padding: "16px 20px",
              cursor: "pointer",
              border: status === s ? "2px solid var(--primary-500)" : undefined,
              background: status === s ? "var(--primary-50)" : undefined,
              textAlign: "left",
            }}
          >
            <div style={{ fontSize: 24, fontWeight: 800, color: "var(--text-main)" }}>
              {counts[s as keyof typeof counts] ?? 0}
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {s === "all" ? "Total" : s.replace("_", " ")}
            </div>
          </button>
        ))}
      </div>

      {/* Error */}
      {error && <div className="state-error" style={{ marginBottom: 16 }}>⚠️ {error}</div>}

      {/* Table */}
      <div className="card">
        {loading ? (
          <div className="state-loading">Loading tickets...</div>
        ) : tickets.length === 0 ? (
          <div className="state-empty">No tickets found for this filter.</div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Category</th>
                  <th>Subject</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <React.Fragment key={t.id}>
                    <tr
                      onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                      style={{ cursor: "pointer" }}
                    >
                      <td>
                        <div style={{ fontWeight: 600 }}>{t.users?.name ?? "Unknown"}</div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{t.users?.phone ?? "-"}</div>
                      </td>
                      <td><span className="badge badge-info">{t.category}</span></td>
                      <td style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {t.subject}
                      </td>
                      <td><span className={statusBadge(t.status)}>{t.status.replace("_", " ")}</span></td>
                      <td style={{ fontSize: 13, color: "var(--text-muted)" }}>{formatDate(t.created_at)}</td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          {(["in_progress", "resolved", "closed"] as const).map((ns) => (
                            <button
                              key={ns}
                              onClick={(e) => { e.stopPropagation(); updateTicket(t, ns); }}
                              disabled={t.status === ns}
                              className="btn btn-outline"
                              style={{
                                padding: "6px 10px",
                                fontSize: 12,
                                opacity: t.status === ns ? 0.4 : 1,
                              }}
                            >
                              {ns === "in_progress" ? "⏳ Progress" : ns === "resolved" ? "✅ Resolve" : "🔒 Close"}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                    {/* Expanded Detail Row */}
                    {expandedId === t.id && (
                      <tr>
                        <td colSpan={6} style={{ background: "var(--bg-color)", padding: 24 }}>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase" }}>Message</div>
                              <div style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{t.message}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase" }}>Admin Reply</div>
                              <div style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap", color: t.admin_reply ? "var(--text-main)" : "var(--text-light)" }}>
                                {t.admin_reply || "No reply yet"}
                              </div>
                            </div>
                          </div>
                          <div style={{ marginTop: 12, fontSize: 12, color: "var(--text-light)" }}>
                            Ticket ID: <code className="mono">{t.id}</code>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
