"use client";

import React from "react";
import { getSupabaseClient } from "../lib/supabase/browser";

export type AdminGateProps = {
  children: React.ReactNode;
  requiredRole?: "admin" | "super_admin" | "any";
};

async function fetchMyRole(): Promise<string | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error: userError } = await supabase.auth.getUser();
  const user = data?.user;

  if (userError) throw userError;
  if (!user) return null;

  const { data: roleData, error } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error) throw error;
  const role = (roleData as any)?.role;
  return (role as string | null) ?? null;
}

export function AdminGate({
  children,
  requiredRole = "any",
}: AdminGateProps) {
  const [status, setStatus] = React.useState<
    "checking" | "authorized" | "unauthorized" | "error"
  >("checking");
  const [message, setMessage] = React.useState<string>("");

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const supabase = getSupabaseClient();
        if (!supabase) {
          if (!cancelled) {
            setStatus("unauthorized");
            setMessage("Supabase is not configured.");
          }
          return;
        }

        const { data } = await supabase.auth.getSession();
        if (!data.session?.access_token) {
          if (!cancelled) {
            setStatus("unauthorized");
            setMessage("Please login to access the admin panel.");
          }
          return;
        }

        const role = await fetchMyRole();
        const isAuthorized =
          requiredRole === "any"
            ? role === "admin" || role === "super_admin"
            : requiredRole === "admin"
              ? role === "admin" // v1: separate enforcement requires DB policy gaps to be addressed
              : role === "super_admin";

        if (!cancelled) {
          setStatus(isAuthorized ? "authorized" : "unauthorized");
          setMessage(
            isAuthorized
              ? ""
              : "Your account does not have permission for this area."
          );
        }
      } catch (e: any) {
        if (!cancelled) {
          setStatus("error");
          setMessage(e?.message ?? String(e));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [requiredRole]);

  if (status === "checking") {
    return <div style={{ padding: 24 }}>Checking permissions...</div>;
  }

  if (status !== "authorized") {
    return (
      <div style={{ padding: 24 }}>
        <h1>Access denied</h1>
        <p>{message}</p>
        <p>
          <a href="/admin/login">Go to login</a>
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

