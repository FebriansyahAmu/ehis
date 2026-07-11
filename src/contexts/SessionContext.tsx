"use client";

// Sesi pengguna sisi klien — ambil GET /auth/me sekali saat mount, sediakan ke seluruh
// shell modul. `can(resource, action)` = gating UI berbasis permission efektif (union role).
// Gating UI ≠ enforcement: server tetap penjaga sebenarnya (route()/getActor). Ini hanya
// menyembunyikan menu/aksi yang tak relevan. Selama AUTH_ENFORCE=false, sesi bisa null
// (belum login) → komponen menampilkan fallback netral.

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { fetchMe, logout as apiLogout, type SessionDTO } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

interface SessionContextValue {
  session: SessionDTO | null;
  loading: boolean;
  /** true bila punya izin "resource:action" (superuser/Admin = selalu true). */
  can: (resource: string, action: string) => boolean;
  refetch: () => Promise<void>;
  logout: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({
  children,
  initialSession = null,
}: {
  children: ReactNode;
  /** Sesi hasil seed SSR (cookie) — bila ada, first paint langsung benar (anti-flicker sidebar). */
  initialSession?: SessionDTO | null;
}) {
  const [session, setSession] = useState<SessionDTO | null>(initialSession);
  const [loading, setLoading] = useState(initialSession == null);

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      setSession(await fetchMe(signal));
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      // 401/akun tak valid → tak ada sesi (bukan error yang perlu di-surface).
      if (e instanceof ApiError) setSession(null);
      else setSession(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Sudah di-seed dari SSR → tak perlu fetch awal (hindari flicker + hemat 1 request).
    if (initialSession) return;
    const ac = new AbortController();
    void load(ac.signal);
    return () => ac.abort();
  }, [load, initialSession]);

  const refetch = useCallback(async () => {
    setLoading(true);
    await load();
  }, [load]);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } finally {
      setSession(null);
    }
  }, []);

  const can = useCallback(
    (resource: string, action: string) =>
      !!session && (session.isSuperuser || session.permissions.includes(`${resource}:${action}`)),
    [session],
  );

  return (
    <SessionContext value={{ session, loading, can, refetch, logout }}>
      {children}
    </SessionContext>
  );
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside <SessionProvider>");
  return ctx;
}

/** Varian tak-melempar — null bila dipakai di luar <SessionProvider> (mis. halaman tanpa shell
 *  sesi). Untuk komponen bersama yang render di konteks ber-/tanpa-provider (mis. SpriIssuePanel). */
export function useSessionOptional(): SessionContextValue | null {
  return useContext(SessionContext);
}
