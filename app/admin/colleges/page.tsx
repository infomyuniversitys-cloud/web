"use client";

import React from "react";
import { getSupabaseClient } from "../../../lib/supabase/browser";
import { downloadCsv } from "../../../lib/csv";

type College = {
  id: string;
  name: string;
  city?: string | null;
  state?: string | null;
  stream?: string | null;
  type?: string | null;
  description?: string | null;
  logo_url?: string | null;
  banner_url?: string | null;
  referral_reward_amount?: number | null;
  approvals?: any;
};

type Course = {
  id: string;
  college_id: string;
  name: string;
  degree_type?: string | null;
  duration?: string | null;
  fees?: number | null;
};

export default function AdminCollegesPage() {
  const supabase = React.useMemo(() => getSupabaseClient() as any, []);

  const [colleges, setColleges] = React.useState<College[]>([]);
  const [courses, setCourses] = React.useState<Course[]>([]);
  const [selectedCollegeId, setSelectedCollegeId] = React.useState<string>("");

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  async function loadColleges() {
    if (!supabase) throw new Error("Supabase is not configured.");
    const { data, error } = await supabase
      .from("colleges")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    setColleges((data ?? []) as any);
    const first = (data?.[0]?.id ?? "") as string;
    setSelectedCollegeId(first);
  }

  async function loadCourses(cid: string) {
    if (!supabase) return;
    if (!cid) {
      setCourses([]);
      return;
    }
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .eq("college_id", cid)
      .order("created_at", { ascending: false });
    if (error) throw error;
    setCourses((data ?? []) as any);
  }

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        await loadColleges();
        if (!cancelled) await loadCourses(selectedCollegeId);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  React.useEffect(() => {
    loadCourses(selectedCollegeId).catch((e: any) => setError(e?.message ?? String(e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCollegeId]);

  async function upsertCollege(payload: Partial<College> & { id?: string }) {
    if (!supabase) return;
    const ok = window.confirm("Save college? (May affect referrals/courses)");
    if (!ok) return;
    setLoading(true);
    setError(null);
    try {
      let result;
      if (payload.id) {
        const { id, ...updates } = payload;
        result = await supabase.from("colleges").update(updates).eq("id", id);
      } else {
        result = await supabase.from("colleges").insert(payload);
      }
      if (result.error) throw result.error;
      await loadColleges();
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  async function deleteCollege(cid: string) {
    if (!supabase) return;
    const ok = window.confirm(
      "Delete this college? This cascades to courses and referrals."
    );
    if (!ok) return;
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.from("colleges").delete().eq("id", cid);
      if (error) throw error;
      setSelectedCollegeId("");
      await loadColleges();
      setCourses([]);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  async function exportCsv() {
    if (!supabase) return;
    const ok = window.confirm("Export colleges to CSV?");
    if (!ok) return;

    setError(null);
    const { data, error } = await supabase.from("colleges").select("*").order("created_at", { ascending: false }).limit(5000);
    
    if (error) {
      setError(error.message);
      return;
    }

    const header = ["id", "name", "city", "state", "stream", "type", "referral_reward_amount", "created_at"];
    const mapped = (data ?? []).map((r: any) => ({
      id: r.id, name: r.name ?? "", city: r.city ?? "", state: r.state ?? "", 
      stream: r.stream ?? "", type: r.type ?? "", referral_reward_amount: r.referral_reward_amount ?? 0,
      created_at: r.created_at ?? ""
    }));

    downloadCsv(`colleges_export_${new Date().toISOString().slice(0,10)}.csv`, header, mapped);
  }

  async function upsertCourse(payload: Partial<Course> & { id?: string; college_id: string }) {
    if (!supabase) return;
    const ok = window.confirm("Save course?");
    if (!ok) return;
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase
        .from("courses")
        .upsert(payload, { onConflict: "id" });
      if (error) throw error;
      await loadCourses(payload.college_id);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  async function deleteCourse(courseId: string, collegeId: string) {
    if (!supabase) return;
    const ok = window.confirm("Delete this course?");
    if (!ok) return;
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.from("courses").delete().eq("id", courseId);
      if (error) throw error;
      await loadCourses(collegeId);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  const selectedCollege = colleges.find(c => c.id === selectedCollegeId);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1>Colleges & Courses</h1>
          <p>Manage educational institutions and their course offerings.</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-outline" onClick={exportCsv} disabled={loading}>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export CSV
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              const name = window.prompt("College name?");
              if (!name) return;
              const rewardStr = window.prompt("Referral reward amount (₹)?", "0");
              const reward = rewardStr !== null ? parseFloat(rewardStr) || 0 : 0;
              upsertCollege({
                name: name.trim(), city: "", state: "", stream: "", type: "",
                description: "", logo_url: "", banner_url: "", referral_reward_amount: reward,
              });
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add College
          </button>
        </div>
      </div>

      {error && <div className="state-error" style={{ marginBottom: 16 }}>{error}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: 24 }}>
        {/* College List */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h2 style={{ margin: 0, fontSize: "0.95rem", color: "var(--text-secondary)" }}>
              Institutions
              <span style={{ fontWeight: 400, color: "var(--text-light)", marginLeft: 8 }}>({colleges.length})</span>
            </h2>
          </div>

          {loading && colleges.length === 0 ? <div className="state-loading">Loading...</div> : null}

          <div style={{ display: "grid", gap: 8 }}>
            {colleges.map((c) => (
              <div
                key={c.id}
                className="card"
                style={{
                  padding: 16,
                  cursor: "pointer",
                  borderLeft: c.id === selectedCollegeId ? "3px solid var(--primary-500)" : "3px solid transparent",
                  background: c.id === selectedCollegeId ? "var(--primary-50)" : "var(--surface-color)",
                  transition: "all var(--transition-fast)",
                }}
                onClick={() => setSelectedCollegeId(c.id)}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontWeight: 700, color: "var(--text-main)", fontSize: "0.9rem" }}>{c.name}</div>
                    {c.city && <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: 2 }}>{c.city}{c.state ? `, ${c.state}` : ""}</div>}
                  </div>
                  <span className="badge badge-success" style={{ fontSize: "0.7rem" }}>
                    ₹{c.referral_reward_amount ?? 0}
                  </span>
                </div>
                <div style={{ marginTop: 12, display: "flex", gap: 6 }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const nextName = window.prompt("Edit college name", c.name);
                      if (!nextName) return;
                      const rewardStr = window.prompt("Referral reward amount (₹)", String(c.referral_reward_amount ?? 0));
                      const reward = rewardStr !== null ? parseFloat(rewardStr) || 0 : (c.referral_reward_amount ?? 0);
                      upsertCollege({ id: c.id, name: nextName.trim(), referral_reward_amount: reward });
                    }}
                    className="btn btn-outline"
                    style={{ padding: "4px 10px", fontSize: "0.7rem" }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteCollege(c.id); }}
                    className="btn btn-danger"
                    style={{ padding: "4px 10px", fontSize: "0.7rem" }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {colleges.length === 0 && !loading && (
              <div className="state-empty">No colleges found.</div>
            )}
          </div>
        </div>

        {/* Courses Panel */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h2 style={{ margin: 0, fontSize: "0.95rem", color: "var(--text-secondary)" }}>
              Courses
              {selectedCollege && <span style={{ fontWeight: 400, color: "var(--text-light)", marginLeft: 8 }}>for {selectedCollege.name}</span>}
            </h2>
            <button
              className="btn btn-primary"
              style={{ fontSize: "0.75rem", padding: "6px 12px" }}
              onClick={() => {
                if (!selectedCollegeId) { window.alert("Select a college first."); return; }
                const name = window.prompt("Course name?");
                if (!name) return;
                const degree = window.prompt("Degree type? (e.g. B.Tech, MBA, BBA)", "") ?? "";
                const duration = window.prompt("Duration? (e.g. 4 years, 2 years)", "") ?? "";
                const feesStr = window.prompt("Fees (₹)?", "0");
                const fees = feesStr !== null ? parseFloat(feesStr) || 0 : 0;
                upsertCourse({ college_id: selectedCollegeId, name: name.trim(), degree_type: degree.trim(), duration: duration.trim(), fees });
              }}
            >
              + Add Course
            </button>
          </div>

          {!selectedCollegeId ? (
            <div className="card" style={{ padding: 60, textAlign: "center" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: 8, opacity: 0.4 }}>🏛️</div>
              <p style={{ color: "var(--text-muted)" }}>Select a college to manage its courses.</p>
            </div>
          ) : (
            <div className="card">
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Course ID</th>
                      <th>Name</th>
                      <th>Degree</th>
                      <th>Duration</th>
                      <th>Fees</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courses.map((course) => (
                      <tr key={course.id}>
                        <td><span className="mono">{course.id.slice(0, 8)}</span></td>
                        <td style={{ fontWeight: 600 }}>{course.name}</td>
                        <td><span className="badge badge-info">{course.degree_type ?? "-"}</span></td>
                        <td>{course.duration ?? "-"}</td>
                        <td style={{ fontWeight: 600 }}>₹{(course.fees ?? 0).toLocaleString()}</td>
                        <td>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button
                              onClick={() => {
                                const nextName = window.prompt("Edit course name", course.name);
                                if (!nextName) return;
                                const degree = window.prompt("Degree type", course.degree_type ?? "") ?? (course.degree_type ?? "");
                                const duration = window.prompt("Duration", course.duration ?? "") ?? (course.duration ?? "");
                                const feesStr = window.prompt("Fees (₹)", String(course.fees ?? 0));
                                const fees = feesStr !== null ? parseFloat(feesStr) || 0 : (course.fees ?? 0);
                                upsertCourse({ ...course, name: nextName.trim(), degree_type: degree.trim(), duration: duration.trim(), fees });
                              }}
                              className="btn btn-outline"
                              style={{ padding: "4px 10px", fontSize: "0.7rem" }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteCourse(course.id, course.college_id)}
                              className="btn btn-danger"
                              style={{ padding: "4px 10px", fontSize: "0.7rem" }}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {courses.length === 0 && !loading ? (
                      <tr><td colSpan={6} className="state-empty">No courses found for this college.</td></tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
