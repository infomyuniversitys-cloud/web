"use client";

import React from "react";
import { getSupabaseClient } from "../../../lib/supabase/browser";

type ConfigRow = {
  key: string;
  value: string;
  description?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

const jsonKeys = new Set<string>([
  "referral_milestones",
  "referral_tiers",
]);

export default function AdminConfigPage() {
  const supabase = React.useMemo(() => getSupabaseClient() as any, []);

  const [rows, setRows] = React.useState<ConfigRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [editKey, setEditKey] = React.useState<string | null>(null);
  const [editValue, setEditValue] = React.useState<string>("");
  const [editDesc, setEditDesc] = React.useState<string>("");

  async function load() {
    if (!supabase) throw new Error("Supabase is not configured.");
    setLoading(true);
    setError(null);
    const { data, error: qError } = await supabase
      .from("app_config")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (qError) throw qError;
    setRows((data ?? []) as any);
    setLoading(false);
  }

  React.useEffect(() => {
    load().catch((e: any) => {
      setError(e?.message ?? String(e));
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  function startEdit(r: ConfigRow) {
    setEditKey(r.key);
    
    // Formatting JSON nicely for editing if it's a JSON key
    let displayValue = r.value ?? "";
    if (jsonKeys.has(r.key)) {
      try {
        const parsed = JSON.parse(displayValue);
        displayValue = JSON.stringify(parsed, null, 2);
      } catch (e) {
        // If it fails to parse, just show raw string
      }
    }
    
    setEditValue(displayValue);
    setEditDesc(r.description ?? "");
  }

  function cancelEdit() {
    setEditKey(null);
    setEditValue("");
    setEditDesc("");
    setError(null);
  }

  async function saveEdit(key: string) {
    if (!supabase) return;

    let finalValue = editValue;
    if (jsonKeys.has(key)) {
      try {
        // Compact JSON before saving
        const parsed = JSON.parse(editValue);
        finalValue = JSON.stringify(parsed);
      } catch {
        setError(`Value for ${key} must be valid JSON.`);
        return;
      }
    }

    setLoading(true);
    setError(null);
    try {
      const { error: uError } = await supabase
        .from("app_config")
        .update({
          value: finalValue,
          description: editDesc.trim() || null,
        })
        .eq("key", key);
      if (uError) throw uError;
      
      setEditKey(null);
      await load();
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-fade-in" style={{ paddingBottom: 60 }}>
      <div className="page-header">
        <div>
          <h1>System Config</h1>
          <p>
            Manage application parameters, referral goals, and legal content
          </p>
        </div>
      </div>

      {error && <div className="state-error" style={{ marginBottom: 24 }}>{error}</div>}

      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Key</th>
                <th>Value Preview</th>
                <th>Description</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="state-loading">
                    Loading configuration...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="state-empty">
                    No configuration keys found.
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const isEditing = editKey === r.key;
                  
                  if (isEditing) {
                    return (
                      <tr key={r.key} style={{ backgroundColor: "var(--primary-50)" }}>
                        <td style={{ verticalAlign: "top" }}>
                          <span className="mono" style={{ fontWeight: 600, color: "var(--primary-700)", display: "inline-block", marginBottom: 8 }}>
                            {r.key}
                          </span>
                          {jsonKeys.has(r.key) && (
                            <div>
                              <span className="badge badge-info">JSON DATA</span>
                            </div>
                          )}
                        </td>
                        <td style={{ verticalAlign: "top", width: "50%" }}>
                          <textarea
                            className="input-field"
                            style={{ 
                              width: "100%", 
                              minHeight: jsonKeys.has(r.key) ? 200 : 100,
                              fontFamily: jsonKeys.has(r.key) ? "monospace" : "inherit",
                              fontSize: jsonKeys.has(r.key) ? 13 : 14,
                              resize: "vertical"
                            }}
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            placeholder={jsonKeys.has(r.key) ? '{"key": "value"}' : "Enter value..."}
                          />
                        </td>
                        <td style={{ verticalAlign: "top" }}>
                          <textarea
                            className="input-field"
                            style={{ 
                              width: "100%", 
                              minHeight: 100, 
                              fontSize: 14,
                              resize: "vertical"
                            }}
                            value={editDesc}
                            onChange={(e) => setEditDesc(e.target.value)}
                            placeholder="Optional description..."
                          />
                        </td>
                        <td style={{ verticalAlign: "top", textAlign: "right", whiteSpace: "nowrap" }}>
                          <div style={{ display: "flex", gap: 8, flexDirection: "column", alignItems: "flex-end" }}>
                            <button
                              onClick={() => saveEdit(r.key)}
                              className="btn btn-primary"
                              disabled={loading}
                              style={{ width: "100%", justifyContent: "center" }}
                            >
                              {loading ? "Saving..." : "Save"}
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="btn btn-outline"
                              disabled={loading}
                              style={{ width: "100%", justifyContent: "center" }}
                            >
                              Cancel
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  // Read-only mode
                  return (
                    <tr key={r.key}>
                      <td style={{ verticalAlign: "top" }}>
                        <span className="mono">{r.key}</span>
                      </td>
                      <td style={{ verticalAlign: "top", maxWidth: 400 }}>
                        <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", maxHeight: 120, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 5, WebkitBoxOrient: "vertical" }}>
                          {String(r.value ?? "")}
                        </div>
                      </td>
                      <td style={{ verticalAlign: "top", maxWidth: 300 }}>
                        <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", color: "var(--text-muted)" }}>
                          {r.description ?? <span style={{ opacity: 0.5 }}>No description</span>}
                        </div>
                      </td>
                      <td style={{ verticalAlign: "top", textAlign: "right" }}>
                        <button
                          onClick={() => startEdit(r)}
                          className="btn btn-outline"
                          disabled={loading || editKey !== null}
                        >
                          Modify
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


