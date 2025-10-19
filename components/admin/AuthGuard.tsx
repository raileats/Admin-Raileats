// components/admin/AuthGuard.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";

/**
 * AuthGuard
 * - Verifies session by calling /api/admin/me (cookie-aware Supabase check).
 * - If not authenticated, redirects to /admin/login using location.replace().
 * - Implements inactivity logout (default 1 hour). Resets on user activity.
 * - Re-checks session on visibilitychange and popstate to avoid back-button showing protected UI.
 *
 * Usage:
 * <AuthGuard inactivityMs={30 * 60 * 1000}>
 *   ...protected admin UI...
 * </AuthGuard>
 */

type Props = {
  children: React.ReactNode;
  inactivityMs?: number; // milliseconds; default 1 hour
};

export default function AuthGuard({ children, inactivityMs = 60 * 60 * 1000 }: Props) {
  const [checking, setChecking] = useState(true);
  const timerRef = useRef<number | null>(null);
  const mountedRef = useRef(false);

  // redirect helper (replace to avoid back-button reopening protected page)
  const redirectToLogin = () => {
    try {
      window.location.replace("/admin/login");
    } catch {
      // fallback
      window.location.href = "/admin/login";
    }
  };

  // call logout endpoint then redirect
  const doLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch (e) {
      console.error("doLogout error:", e);
    } finally {
      redirectToLogin();
    }
  };

  // check session by calling your existing cookie-aware endpoint
  const checkSession = async () => {
    try {
      const res = await fetch("/api/admin/me", { method: "GET", credentials: "include" });
      if (!res.ok) {
        redirectToLogin();
        return false;
      }
      return true;
    } catch (e) {
      redirectToLogin();
      return false;
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    mountedRef.current = true;

    // initial session check
    checkSession();

    // reset inactivity timer
    const resetTimer = () => {
      if (!mountedRef.current) return;
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
      timerRef.current = window.setTimeout(() => {
        // inactivity timeout reached -> logout
        doLogout();
      }, inactivityMs);
    };

    // events that indicate activity
    const events: Array<keyof DocumentEventMap> = ["mousemove", "keydown", "click", "touchstart"];

    // attach listeners
    events.forEach((ev) => document.addEventListener(ev, resetTimer, { passive: true }));

    // start timer
    resetTimer();

    // re-check session when tab becomes visible again
    const onVisibility = () => {
      if (!document.hidden) {
        // quick check
        checkSession();
        // also reset inactivity timer on return
        resetTimer();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    // re-check on history navigation (back/forward)
    const onPop = () => {
      checkSession();
    };
    window.addEventListener("popstate", onPop);

    return () => {
      mountedRef.current = false;
      events.forEach((ev) => document.removeEventListener(ev, resetTimer));
      if (timerRef.current) window.clearTimeout(timerRef.current);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("popstate", onPop);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (checking) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        Checking session...
      </div>
    );
  }

  return <>{children}</>;
}
