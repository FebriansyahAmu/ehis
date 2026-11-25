import { connection } from "next/server";
import KepesertaanPage from "@/components/bpjs/kepesertaan/KepesertaanPage";
import type { SumberData } from "@/components/bpjs/kepesertaan/kepesertaanShared";
import { requireBpjsMenu } from "@/lib/auth/requireBpjsMenu";
import { bacaBpjsLive, getBpjsConfig } from "@/lib/bpjs/server/config";

export const metadata = { title: "Kepesertaan — BPJS Integration Hub" };

/** Sumber data dibaca dari env SERVER saat request (bukan saat build); hanya label, tanpa nilai env. */
function sumberData(): SumberData {
  try {
    const cfg = getBpjsConfig();
    if (!bacaBpjsLive(cfg)) return { live: false, label: "Data uji" };
    if (cfg.mode === "prod") return { live: true, label: "V-Claim produksi" };
    if (cfg.mode === "sandbox") return { live: true, label: "V-Claim sandbox" };
    return { live: true, label: "V-Claim langsung (baca)" };
  } catch {
    // Env BPJS tidak valid → pencarian akan menampilkan galat konfigurasi dari server.
    return { live: true, label: "V-Claim (periksa konfigurasi)" };
  }
}

export default async function Page() {
  await requireBpjsMenu("/ehis-bpjs/vclaim/kepesertaan");
  await connection();
  return <KepesertaanPage sumber={sumberData()} />;
}
