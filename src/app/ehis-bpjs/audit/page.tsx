import AuditTrailPage from "@/components/bpjs/audit/AuditTrailPage";
import { bacaSaringAwal } from "@/components/bpjs/audit/auditShared";
import { requireBpjsMenu } from "@/lib/auth/requireBpjsMenu";

// Saringan awal dari URL (mis. tautan Beranda BPJS `?periode=hari&hasil=gagal`) — hanya nilai yang
// dikenal yang dipakai. `key` me-remount halaman bila parameternya berubah agar state ikut segar.
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireBpjsMenu("/ehis-bpjs/audit");
  const awal = bacaSaringAwal(await searchParams);
  return <AuditTrailPage key={JSON.stringify(awal)} awal={awal} />;
}
