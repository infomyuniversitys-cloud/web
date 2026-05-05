"use client";

import React from "react";
import { getSupabaseClient } from "../../../lib/supabase/browser";

type Announcement = {
  id: string;
  title?: string | null;
  image_url?: string | null;
  action_path?: string | null;
  button_text?: string | null;
  is_active?: boolean | null;
  priority?: number | null;
  frequency?: string | null;
  created_at?: string | null;
};

type Promotion = {
  id: string;
  title?: string | null;
  description?: string | null;
  icon_name?: string | null;
  color_hex?: string | null;
  type?: string | null;
  is_active?: boolean | null;
  starts_at?: string | null;
  ends_at?: string | null;
  image_url?: string | null;
  link_url?: string | null;
  created_at?: string | null;
};

export default function AdminAnnouncementsPage() {
  const supabase = React.useMemo(() => getSupabaseClient() as any, []);

  const [announcements, setAnnouncements] = React.useState<Announcement[]>([]);
  const [promotions, setPromotions] = React.useState<Promotion[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<"announcements" | "banners" | "challenges">("announcements");

  async function loadAll() {
    if (!supabase) throw new Error("Supabase is not configured.");
    setLoading(true);
    setError(null);
    const [a, p] = await Promise.all([
      supabase.from("announcements").select("*").order("priority", { ascending: false }).limit(200),
      supabase.from("promotions").select("*").order("created_at", { ascending: false }).limit(200),
    ]);
    if (a.error) throw a.error;
    if (p.error) throw p.error;
    setAnnouncements((a.data ?? []) as any);
    setPromotions((p.data ?? []) as any);
    setLoading(false);
  }

  React.useEffect(() => {
    loadAll().catch((e: any) => { setError(e?.message ?? String(e)); setLoading(false); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  async function deleteAnnouncement(id: string) {
    if (!window.confirm("Delete this announcement?")) return;
    const { error } = await supabase.from("announcements").delete().eq("id", id);
    if (error) throw error;
    await loadAll();
  }

  async function toggleAnnouncement(id: string, next: boolean) {
    const { error } = await supabase.from("announcements").update({ is_active: next }).eq("id", id);
    if (error) throw error;
    await loadAll();
  }

  async function deletePromotion(id: string) {
    if (!window.confirm("Delete this promotion?")) return;
    const { error } = await supabase.from("promotions").delete().eq("id", id);
    if (error) throw error;
    await loadAll();
  }

  async function togglePromotion(id: string, next: boolean) {
    const { error } = await supabase.from("promotions").update({ is_active: next }).eq("id", id);
    if (error) throw error;
    await loadAll();
  }

  async function upsertPromotion(p: Partial<Promotion>) {
    if (!window.confirm("Save changes?")) return;
    const { id, ...rest } = p;
    const { error } = await supabase.from("promotions").update(rest).eq("id", id);
    if (error) throw error;
    await loadAll();
  }

  const banners = promotions.filter(p => p.type === "banner");
  const challenges = promotions.filter(p => p.type === "weekly_challenge" || p.type === "announcement");

  const tabs = [
    { key: "announcements" as const, label: "📢 Announcements", count: announcements.length },
    { key: "banners" as const, label: "🖼️ Banners", count: banners.length },
    { key: "challenges" as const, label: "⚡ Challenges", count: challenges.length },
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1>📢 Announcements & Promotions</h1>
          <p>Manage in-app announcements, banners, and challenges</p>
        </div>
        <button className="btn btn-outline" onClick={() => loadAll().catch((e) => setError(e?.message ?? String(e)))}>
          ↻ Refresh
        </button>
      </div>

      {error && <div className="state-error" style={{ marginBottom: 16 }}>⚠️ {error}</div>}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: "2px solid var(--border-color)", paddingBottom: 0 }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: "12px 20px",
              border: "none",
              background: "transparent",
              fontWeight: activeTab === tab.key ? 700 : 500,
              fontSize: 14,
              color: activeTab === tab.key ? "var(--primary-600)" : "var(--text-muted)",
              borderBottom: activeTab === tab.key ? "2px solid var(--primary-600)" : "2px solid transparent",
              cursor: "pointer",
              transition: "all 150ms ease",
              marginBottom: -2,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {tab.label}
            <span style={{
              background: activeTab === tab.key ? "var(--primary-100)" : "var(--hover-bg)",
              color: activeTab === tab.key ? "var(--primary-700)" : "var(--text-muted)",
              padding: "2px 8px",
              borderRadius: 99,
              fontSize: 12,
              fontWeight: 700,
            }}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {loading && <div className="state-loading">Loading...</div>}

      {/* ─── Announcements Tab ─── */}
      {activeTab === "announcements" && !loading && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <button
              className="btn btn-primary"
              onClick={() => {
                const title = window.prompt("Announcement title?");
                if (!title) return;
                const image_url = window.prompt("Image URL?", "") ?? "";
                const action_path = window.prompt("Action path (deep link)?", "/") ?? "/";
                const button_text = window.prompt("Button text?", "View Details") ?? "View Details";
                const priority = Number(window.prompt("Priority?", "0") ?? "0");
                const frequency = window.prompt("Frequency (always|once_daily|once_ever)?", "once_daily") ?? "once_daily";
                const is_active = (window.prompt("Active? (true/false)", "true") ?? "true").toLowerCase() === "true";
                supabase.from("announcements").insert({ title: title.trim(), image_url, action_path, button_text, priority, frequency, is_active })
                  .then(() => loadAll()).catch((e: any) => setError(e?.message ?? String(e)));
              }}
            >
              + Add Announcement
            </button>
          </div>

          {announcements.length === 0 ? (
            <div className="card"><div className="state-empty">No announcements yet.</div></div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {announcements.map((a) => (
                <div key={a.id} className="card" style={{ padding: 20, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: 15 }}>{a.title ?? "Untitled"}</span>
                      <span className={`badge ${(a.is_active ?? true) ? "badge-success" : "badge-neutral"}`}>
                        {(a.is_active ?? true) ? "Active" : "Disabled"}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 16, fontSize: 13, color: "var(--text-muted)" }}>
                      <span>Priority: <strong>{a.priority ?? 0}</strong></span>
                      <span>Frequency: <strong>{a.frequency ?? "-"}</strong></span>
                      <span>Path: <code className="mono">{a.action_path ?? "/"}</code></span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <button
                      className="btn btn-outline"
                      style={{ padding: "6px 12px", fontSize: 13 }}
                      onClick={() => toggleAnnouncement(a.id, !(a.is_active ?? true))}
                    >
                      {(a.is_active ?? true) ? "Disable" : "Enable"}
                    </button>
                    <button
                      className="btn btn-outline"
                      style={{ padding: "6px 12px", fontSize: 13 }}
                      onClick={() => {
                        const nextTitle = window.prompt("Edit title", a.title ?? "");
                        if (!nextTitle) return;
                        const nextPriority = window.prompt("Priority", String(a.priority ?? 0));
                        const nextFrequency = window.prompt("Frequency", a.frequency ?? "once_daily") ?? (a.frequency ?? "once_daily");
                        supabase.from("announcements").update({ title: nextTitle.trim(), priority: nextPriority ? Number(nextPriority) : a.priority, frequency: nextFrequency.trim() }).eq("id", a.id)
                          .then(() => loadAll()).catch((e: any) => setError(e?.message ?? String(e)));
                      }}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      className="btn btn-outline"
                      style={{ padding: "6px 12px", fontSize: 13, color: "var(--status-danger-text)", borderColor: "#fca5a5" }}
                      onClick={() => deleteAnnouncement(a.id).catch((e: any) => setError(e?.message ?? String(e)))}
                    >
                      🗑
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Banners Tab ─── */}
      {activeTab === "banners" && !loading && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <button
              className="btn btn-primary"
              onClick={() => {
                const title = window.prompt("Banner title?");
                if (!title) return;
                const image_url = window.prompt("Image URL?", "") ?? "";
                const link_url = window.prompt("Link URL / deep link?", "") ?? "";
                const is_active = (window.prompt("Active? (true/false)", "true") ?? "true").toLowerCase() === "true";
                supabase.from("promotions").insert({ title: title.trim(), description: "", type: "banner", is_active, image_url, link_url })
                  .then(({ error }: any) => { if (error) throw error; return loadAll(); })
                  .catch((e: any) => { alert("Error: " + JSON.stringify(e)); setError(e?.message ?? String(e)); });
              }}
            >
              + Add Banner
            </button>
          </div>

          {banners.length === 0 ? (
            <div className="card"><div className="state-empty">No banners yet.</div></div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
              {banners.map((p) => (
                <div key={p.id} className="card" style={{ overflow: "hidden" }}>
                  {p.image_url && (
                    <div style={{ height: 160, background: `url(${p.image_url}) center/cover no-repeat`, borderBottom: "1px solid var(--border-color)" }} />
                  )}
                  <div style={{ padding: 20 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <span style={{ fontWeight: 700 }}>{p.title ?? "Untitled"}</span>
                      <span className={`badge ${(p.is_active ?? true) ? "badge-success" : "badge-neutral"}`}>
                        {(p.is_active ?? true) ? "Live" : "Off"}
                      </span>
                    </div>
                    {p.link_url && <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}>🔗 {p.link_url}</div>}
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="btn btn-outline" style={{ padding: "6px 12px", fontSize: 12, flex: 1 }}
                        onClick={() => togglePromotion(p.id, !(p.is_active ?? true))}>{(p.is_active ?? true) ? "Disable" : "Enable"}</button>
                      <button className="btn btn-outline" style={{ padding: "6px 12px", fontSize: 12, flex: 1 }}
                        onClick={() => {
                          const nextTitle = window.prompt("Banner title", p.title ?? "");
                          if (!nextTitle) return;
                          const nextImage = window.prompt("Image URL", p.image_url ?? "") ?? p.image_url ?? "";
                          const nextLink = window.prompt("Link URL", p.link_url ?? "") ?? p.link_url ?? "";
                          upsertPromotion({ id: p.id, title: nextTitle.trim(), image_url: nextImage, link_url: nextLink });
                        }}>✏️ Edit</button>
                      <button className="btn btn-outline" style={{ padding: "6px 12px", fontSize: 12, color: "var(--status-danger-text)", borderColor: "#fca5a5" }}
                        onClick={() => deletePromotion(p.id).catch((e: any) => setError(e?.message ?? String(e)))}>🗑</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Challenges Tab ─── */}
      {activeTab === "challenges" && !loading && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <button
              className="btn btn-primary"
              onClick={() => {
                const title = window.prompt("Challenge title?");
                if (!title) return;
                const description = window.prompt("Description?", "") ?? "";
                const is_active = (window.prompt("Active? (true/false)", "true") ?? "true").toLowerCase() === "true";
                supabase.from("promotions").insert({ title: title.trim(), description, type: "weekly_challenge", is_active })
                  .then(({ error }: any) => { if (error) throw error; return loadAll(); })
                  .catch((e: any) => { alert("Error: " + JSON.stringify(e)); setError(e?.message ?? String(e)); });
              }}
            >
              + Add Challenge
            </button>
          </div>

          {challenges.length === 0 ? (
            <div className="card"><div className="state-empty">No challenges yet.</div></div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {challenges.map((p) => (
                <div key={p.id} className="card" style={{ padding: 20, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700 }}>⚡ {p.title ?? "Untitled"}</span>
                      <span className={`badge ${(p.is_active ?? true) ? "badge-success" : "badge-neutral"}`}>
                        {(p.is_active ?? true) ? "Active" : "Disabled"}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{p.description || "No description"}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <button className="btn btn-outline" style={{ padding: "6px 12px", fontSize: 13 }}
                      onClick={() => togglePromotion(p.id, !(p.is_active ?? true))}>{(p.is_active ?? true) ? "Disable" : "Enable"}</button>
                    <button className="btn btn-outline" style={{ padding: "6px 12px", fontSize: 13 }}
                      onClick={() => {
                        const nextTitle = window.prompt("Edit title", p.title ?? "");
                        if (!nextTitle) return;
                        const nextDesc = window.prompt("Description", p.description ?? "") ?? p.description ?? "";
                        upsertPromotion({ id: p.id, title: nextTitle.trim(), description: nextDesc });
                      }}>✏️ Edit</button>
                    <button className="btn btn-outline" style={{ padding: "6px 12px", fontSize: 13, color: "var(--status-danger-text)", borderColor: "#fca5a5" }}
                      onClick={() => deletePromotion(p.id).catch((e: any) => setError(e?.message ?? String(e)))}>🗑</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
