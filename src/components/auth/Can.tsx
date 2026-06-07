"use client";

// Gating AKSI UI (Fase 2e TODO-RBAC-MODUL). Sembunyikan/disable elemen bila user tak punya
// izin `resource:action`. INI HANYA UX — server (assertCan di route) tetap penjaga sebenarnya.
// Superuser (Admin) → can() selalu true. Sesi belum termuat → can() false (sembunyi sementara).
//
// Pemakaian:
//   <Can resource="registration.pasien" action="create"><button>Pasien Baru</button></Can>
//   const can = useCan(); ... disabled={!can("master.ruangan","delete")}

import type { ReactNode } from "react";
import { useSession } from "@/contexts/SessionContext";

export function useCan() {
  return useSession().can;
}

export function Can({
  resource,
  action,
  children,
  fallback = null,
}: {
  resource: string;
  action: string;
  children: ReactNode;
  /** Ditampilkan saat TAK berizin (mis. tombol disabled / placeholder). Default: tidak render. */
  fallback?: ReactNode;
}) {
  const { can } = useSession();
  return <>{can(resource, action) ? children : fallback}</>;
}
