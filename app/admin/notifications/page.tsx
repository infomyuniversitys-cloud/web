"use client";

import React from "react";
import { getSupabaseClient } from "../../../lib/supabase/browser";

const notificationTypes = [
  "referral_status",
  "reward_allocated",
  "payout_processed",
  "payout_failed",
  "kyc_approved",
  "kyc_rejected",
  "ticket",
  "referral",
  "kyc",
  "payout",
  "system",
];

export default function AdminNotificationsPage() {
  const supabase = React.useMemo(() => getSupabaseClient() as any, []);

  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [type, setType] = React.useState(notificationTypes[0]);
  const [deepLink, setDeepLink] = React.useState("");
  const [image, setImage] = React.useState("");
  const [metadataJson, setMetadataJson] = React.useState("{}");
  const [limit, setLimit] = React.useState<number>(5000);

  const [busy, setBusy] = React.useState(false);
  const [result, setResult] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const [singleUserId, setSingleUserId] = React.useState<string>("");
  const [singleBusy, setSingleBusy] = React.useState(false);
  const [singleResult, setSingleResult] = React.useState<string | null>(null);
  const [singleError, setSingleError] = React.useState<string | null>(null);

  const [logsLimit, setLogsLimit] = React.useState<number>(200);
  const [attempts, setAttempts] = React.useState<any[]>([]);
  const [attemptsLoading, setAttemptsLoading] = React.useState(false);
  const [attemptsError, setAttemptsError] = React.useState<string | null>(null);

  const [devices, setDevices] = React.useState<any[]>([]);
  const [devicesLoading, setDevicesLoading] = React.useState(false);
  const [devicesError, setDevicesError] = React.useState<string | null>(null);

  async function broadcastToAll() {
    if (!supabase) {
      setError("Supabase is not configured.");
      return;
    }

    setBusy(true);
    setError(null);
    setResult(null);

    try {
      if (!title.trim() || !body.trim()) {
        throw new Error("Title and body are required.");
      }

      let metadata: Record<string, any> = {};
      const raw = metadataJson.trim();
      if (raw) {
        try {
          metadata = JSON.parse(raw);
        } catch {
          throw new Error("Metadata must be valid JSON.");
        }
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) {
        throw new Error("Not logged in.");
      }

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Supabase environment variables are missing.");
      }

      const response = await fetch(
        `${supabaseUrl}/functions/v1/broadcast-push-notification`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`,
            "apikey": supabaseAnonKey,
          },
          body: JSON.stringify({
            title: title.trim(),
            body: body.trim(),
            type,
            deep_link: deepLink.trim() || undefined,
            image: image.trim() || undefined,
            metadata,
            limit,
          }),
        }
      );

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json?.error ?? `Broadcast failed (${response.status})`);
      }

      setResult(JSON.stringify(json));
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  }

  async function sendToSingleUser() {
    if (!supabase) {
      setSingleError("Supabase is not configured.");
      return;
    }
    setSingleBusy(true);
    setSingleError(null);
    setSingleResult(null);

    try {
      if (!singleUserId.trim()) throw new Error("User ID is required.");
      if (!title.trim() || !body.trim()) throw new Error("Title and body are required.");

      let metadata: Record<string, any> = {};
      const raw = metadataJson.trim();
      if (raw) {
        try {
          metadata = JSON.parse(raw);
        } catch {
          throw new Error("Metadata must be valid JSON.");
        }
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) throw new Error("Not logged in.");

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Supabase environment variables are missing.");
      }

      const response = await fetch(
        `${supabaseUrl}/functions/v1/admin-send-push-notification`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`,
            "apikey": supabaseAnonKey,
          },
          body: JSON.stringify({
            user_id: singleUserId.trim(),
            title: title.trim(),
            body: body.trim(),
            type,
            deep_link: deepLink.trim() || undefined,
            image: image.trim() || undefined,
            metadata,
          }),
        }
      );

      const json = await response.json();
      if (!response.ok) throw new Error(json?.error ?? `Send failed (${response.status})`);

      setSingleResult(JSON.stringify(json));
    } catch (e: any) {
      setSingleError(e?.message ?? String(e));
    } finally {
      setSingleBusy(false);
    }
  }

  async function loadAttempts() {
    if (!supabase) return;
    setAttemptsLoading(true);
    setAttemptsError(null);
    try {
      const { data, error } = await supabase
        .from("notification_attempts")
        .select("*, notifications(user_id,type,title)")
        .order("attempted_at", { ascending: false })
        .limit(logsLimit);
      if (error) throw error;
      setAttempts((data ?? []) as any);
    } catch (e: any) {
      setAttemptsError(e?.message ?? String(e));
    } finally {
      setAttemptsLoading(false);
    }
  }

  async function loadDevicesForUser() {
    if (!supabase) return;
    if (!singleUserId.trim()) {
      setDevicesError("Enter a user_id to view their devices.");
      setDevices([]);
      return;
    }
    setDevicesLoading(true);
    setDevicesError(null);
    try {
      const { data, error } = await supabase
        .from("user_devices")
        .select("id,fcm_token,platform,is_active,last_seen_at,created_at")
        .eq("user_id", singleUserId.trim())
        .order("last_seen_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      setDevices((data ?? []) as any);
    } catch (e: any) {
      setDevicesError(e?.message ?? String(e));
    } finally {
      setDevicesLoading(false);
    }
  }

  async function deactivateDevice(deviceId: string) {
    if (!supabase) return;
    const ok = window.confirm(`Deactivate device token ${deviceId}?`);
    if (!ok) return;
    setDevicesLoading(true);
    setDevicesError(null);
    try {
      const { error } = await supabase
        .from("user_devices")
        .update({ is_active: false })
        .eq("id", deviceId);
      if (error) throw error;
      await loadDevicesForUser();
    } catch (e: any) {
      setDevicesError(e?.message ?? String(e));
    } finally {
      setDevicesLoading(false);
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1>Push Notifications</h1>
          <p>Broadcast, single-user send, and delivery logs.</p>
        </div>
      </div>

      {/* Compose Section */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <h2 style={{ margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary-500)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            Compose Notification
          </h2>
        </div>
        <div className="card-body">
          <div style={{ display: "grid", gap: 16, maxWidth: 720 }}>
            <div className="input-group">
              <span className="input-label">Title</span>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" placeholder="Notification title..." />
            </div>
            <div className="input-group">
              <span className="input-label">Body</span>
              <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} className="input-field" placeholder="Notification body text..." />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div className="input-group">
                <span className="input-label">Type</span>
                <select value={type} onChange={(e) => setType(e.target.value)} className="input-field">
                  {notificationTypes.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
                </select>
              </div>
              <div className="input-group">
                <span className="input-label">Fan-out Limit</span>
                <input type="number" value={limit} onChange={(e) => setLimit(Number(e.target.value))} min={1} max={20000} className="input-field" />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div className="input-group">
                <span className="input-label">Deep Link (optional)</span>
                <input value={deepLink} onChange={(e) => setDeepLink(e.target.value)} placeholder="/wallet" className="input-field" />
              </div>
              <div className="input-group">
                <span className="input-label">Image URL (optional)</span>
                <input value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://..." className="input-field" />
              </div>
            </div>
            <div className="input-group">
              <span className="input-label">Metadata JSON (optional)</span>
              <textarea value={metadataJson} onChange={(e) => setMetadataJson(e.target.value)} rows={2} className="input-field" style={{ fontFamily: "monospace", fontSize: "0.8rem" }} />
            </div>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button onClick={broadcastToAll} disabled={busy} className="btn btn-primary">
                {busy ? (
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: "spin 1s linear infinite" }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                    Broadcasting...
                  </span>
                ) : "Broadcast to All Users"}
              </button>
            </div>

            {error && <div className="state-error">{error}</div>}
            {result && (
              <pre style={{ padding: 14, borderRadius: "var(--radius-md)", background: "var(--bg-color)", border: "1px solid var(--border-color)", whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: "0.8rem" }}>
                {result}
              </pre>
            )}
          </div>
        </div>
      </div>

      {/* Send to Single User */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <h2 style={{ margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary-500)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            Send to Single User
          </h2>
        </div>
        <div className="card-body">
          <div style={{ display: "grid", gap: 16, maxWidth: 720 }}>
            <div className="input-group">
              <span className="input-label">User ID</span>
              <input value={singleUserId} onChange={(e) => setSingleUserId(e.target.value)} placeholder="uuid..." className="input-field" />
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button onClick={sendToSingleUser} disabled={singleBusy} className="btn btn-primary">
                {singleBusy ? "Sending..." : "Send Push"}
              </button>
              <button onClick={() => loadAttempts().catch(() => {})} className="btn btn-outline">
                Load Delivery Logs
              </button>
              <button onClick={() => loadDevicesForUser().catch(() => {})} className="btn btn-outline">
                Load User Devices
              </button>
            </div>
            {singleError && <div className="state-error">{singleError}</div>}
            {singleResult && (
              <pre style={{ padding: 14, borderRadius: "var(--radius-md)", background: "var(--bg-color)", border: "1px solid var(--border-color)", whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: "0.8rem" }}>
                {singleResult}
              </pre>
            )}
          </div>
        </div>
      </div>

      {/* Delivery Logs */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <h2 style={{ margin: 0 }}>Delivery Logs</h2>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div className="input-group" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <span className="input-label" style={{ margin: 0 }}>Limit</span>
              <input type="number" value={logsLimit} onChange={(e) => setLogsLimit(Number(e.target.value))} min={10} max={1000} className="input-field" style={{ width: 80, padding: "6px 10px" }} />
            </div>
            <button onClick={() => loadAttempts().catch(() => {})} className="btn btn-outline" style={{ padding: "6px 12px", fontSize: "0.75rem" }}>
              Refresh
            </button>
          </div>
        </div>
        {attemptsLoading ? <div className="state-loading">Loading...</div> : attemptsError ? <div className="state-error" style={{ margin: 16 }}>{attemptsError}</div> : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Attempted At</th>
                  <th>Notification ID</th>
                  <th>User ID</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Code</th>
                  <th>Error</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((a) => (
                  <tr key={a.id}>
                    <td style={{ fontSize: "0.8rem" }}>{a.attempted_at ? new Date(a.attempted_at).toLocaleString() : "-"}</td>
                    <td><span className="mono">{a.notification_id?.slice(0, 8) || "-"}</span></td>
                    <td><span className="mono">{(a.notifications?.user_id ?? "-").slice(0, 8)}</span></td>
                    <td><span className="badge badge-info">{a.notifications?.type ?? "-"}</span></td>
                    <td>
                      <span className={`badge ${a.status === "delivered" ? "badge-success" : a.status === "failed" ? "badge-danger" : "badge-warning"}`}>
                        {a.status}
                      </span>
                    </td>
                    <td>{a.response_code ?? "-"}</td>
                    <td style={{ maxWidth: 280, whiteSpace: "normal", fontSize: "0.8rem", color: "var(--text-muted)" }}>{a.error_message ?? "-"}</td>
                  </tr>
                ))}
                {attempts.length === 0 && !attemptsLoading && (
                  <tr><td colSpan={7} className="state-empty">No delivery logs found. Click &quot;Refresh&quot; to load.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Device Tokens */}
      <div className="card">
        <div className="card-header">
          <h2 style={{ margin: 0 }}>Device Tokens</h2>
        </div>
        {devicesLoading ? <div className="state-loading">Loading...</div> : devicesError ? <div className="state-error" style={{ margin: 16 }}>{devicesError}</div> : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Device ID</th>
                  <th>Token (masked)</th>
                  <th>Platform</th>
                  <th>Active</th>
                  <th>Last Seen</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {devices.map((d) => {
                  const token = String(d.fcm_token ?? "");
                  const masked = token.length > 12 ? `...${token.slice(-8)}` : token || "-";
                  return (
                    <tr key={d.id}>
                      <td><span className="mono">{d.id?.slice(0, 8) || "-"}</span></td>
                      <td><span className="mono">{masked}</span></td>
                      <td><span className="badge badge-neutral">{d.platform}</span></td>
                      <td>
                        <span className={`badge ${d.is_active ? "badge-success" : "badge-danger"}`}>
                          {d.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td style={{ fontSize: "0.8rem" }}>{d.last_seen_at ? new Date(d.last_seen_at).toLocaleString() : "-"}</td>
                      <td>
                        <button onClick={() => deactivateDevice(d.id)} disabled={d.is_active === false} className="btn btn-danger" style={{ fontSize: "0.7rem", padding: "4px 10px" }}>
                          Deactivate
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {devices.length === 0 && !devicesLoading && (
                  <tr><td colSpan={6} className="state-empty">No devices found. Enter a User ID above and click &quot;Load User Devices&quot;.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
