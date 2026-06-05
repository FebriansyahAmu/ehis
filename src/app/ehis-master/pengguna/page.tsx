import type { Metadata } from "next";
import PenggunaPage from "@/components/master/pengguna/PenggunaPage";
import { pegawaiService } from "@/lib/services/pegawaiService";
import { userService } from "@/lib/services/userService";
import type { PegawaiListItemDTO } from "@/lib/schemas/pegawai";
import type { UserListItemDTO } from "@/lib/schemas/user";

export const metadata: Metadata = { title: "Pengguna Sistem — Master" };

// Data master bisa berubah → render fresh per request (jangan di-cache statis saat build).
// Saat Redis siap, cache-aside ada di Service → SSR & client /api berbagi satu cache (API-RULES §6.1).
export const dynamic = "force-dynamic";

export default async function Page() {
  // SSR first paint — panggil SERVICE LANGSUNG (tanpa hop HTTP, type-safe). API-RULES §6.1.
  // Gagal → render dengan data kosong + prefetched:false → client refetch saat mount (degradasi anggun).
  let initialPegawai: PegawaiListItemDTO[] = [];
  let initialUsers: UserListItemDTO[] = [];
  let prefetched = false;
  try {
    const [peg, usr] = await Promise.all([
      pegawaiService.listPegawai({ aktif: "true", limit: 50 }),
      userService.listUsers({ limit: 50 }),
    ]);
    initialPegawai = peg.items;
    initialUsers = usr.items;
    prefetched = true;
  } catch {
    /* abaikan — fallback ke client fetch */
  }

  return (
    <PenggunaPage
      initialPegawai={initialPegawai}
      initialUsers={initialUsers}
      prefetched={prefetched}
    />
  );
}
