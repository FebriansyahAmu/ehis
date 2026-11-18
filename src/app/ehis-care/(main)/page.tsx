import type { Metadata } from "next";
import { Clock, Lock } from "lucide-react";
import { getServerActor } from "@/lib/auth/actor";
import { navItemVisible, navScopeFrom, type Can } from "@/lib/navigation";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import CareKpiStrip from "@/components/care/beranda/CareKpiStrip";
import CareServiceCard from "@/components/care/beranda/CareServiceCard";
import { KPIS, SERVICE_GROUPS, SERVICES } from "@/components/care/beranda/careBerandaData";

export const metadata: Metadata = { title: "Pelayanan Medis" };

const TZ = "Asia/Jakarta";

export default async function EhisCareHubPage() {
  const nowDate = new Date();
  const now = nowDate.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: TZ });
  const today = nowDate.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: TZ,
  });

  // ── Filter kartu layanan per assignment user (selaras sidebar careNav) ──
  // Hanya tampilkan layanan yang user boleh akses: RBAC (perm) + careUnit ABAC
  // (unit kerja). Superuser (Admin) & role global → unrestricted → lihat semua.
  // Sumber kebenaran assignment = Pegawai.unitKerja (careUnit) + roster RBAC,
  // sama dgn yang menggerakkan menu Sidebar & enforcement server (requireModule).
  const actor = await getServerActor();
  const can: Can = (r, a) => actor.isSuperuser || actor.permissions.has("*") || actor.permissions.has(`${r}:${a}`);
  const scope = navScopeFrom(actor);
  const services = SERVICES.filter((svc) => navItemVisible(svc, can, scope));
  const groups = SERVICE_GROUPS.map((g) => ({ ...g, items: services.filter((s) => s.group === g.key) })).filter(
    (g) => g.items.length > 0,
  );
  // Urutan stagger animasi masuk lintas kelompok (kartu ke-n tampil 40 ms sesudah kartu sebelumnya).
  const order = new Map(groups.flatMap((g) => g.items).map((s, i) => [s.href, i]));

  return (
    <div data-accent="rose" className="w-full space-y-5 p-4 sm:p-6">
      {/* ── Header ────────────────────────────────────────── */}
      <header className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2 motion-safe:animate-[fade-in_0.35s_ease_both]">
        <div className="min-w-0">
          <p className="m-xs font-medium text-slate-500">{today}</p>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">Pelayanan Medis</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Angka belum terhubung data kunjungan/order — informasi penting, jadi tampil inline (bukan tooltip). */}
          <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800">
            Data contoh
          </Badge>
          <span className="m-xs inline-flex items-center gap-1.5 text-slate-500">
            <Clock className="size-3.5" aria-hidden="true" />
            Ringkasan per{" "}
            <time dateTime={nowDate.toISOString()} className="font-semibold tabular-nums text-slate-700">
              {now} WIB
            </time>
          </span>
        </div>
      </header>

      {/* ── KPI ringkas ───────────────────────────────────── */}
      <section
        aria-label="Statistik ringkasan"
        className="motion-safe:animate-[fade-in_0.35s_ease_both]"
        style={{ animationDelay: "60ms" }}
      >
        <CareKpiStrip items={KPIS} />
      </section>

      {/* ── Layanan per kelompok (selaras grup sidebar) ───── */}
      {groups.length === 0 ? (
        <Card className="items-center gap-2 border-dashed px-6 py-10 text-center shadow-none">
          <span className="flex size-10 items-center justify-center rounded-lg bg-slate-100 text-slate-500" aria-hidden="true">
            <Lock className="size-5" />
          </span>
          <h2 className="m-sm font-semibold text-slate-800">Belum ada layanan yang dapat diakses</h2>
          <p className="m-xs max-w-md leading-relaxed text-slate-500">
            Anda belum ditugaskan ke unit pelayanan mana pun. Hubungi administrator untuk penugasan ruangan/unit kerja
            agar layanan terkait muncul di sini.
          </p>
        </Card>
      ) : (
        groups.map((g) => (
          <section key={g.key} aria-labelledby={`care-grup-${g.key}`}>
            <div className="mb-2.5 flex items-center gap-3">
              <h2 id={`care-grup-${g.key}`} className="m-tiny font-semibold uppercase tracking-wider text-slate-500">
                {g.label}
              </h2>
              <span className="h-px flex-1 bg-slate-200" aria-hidden="true" />
              <span className="m-tiny tabular-nums text-slate-500">{g.items.length} layanan</span>
            </div>
            <ul role="list" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {g.items.map((svc) => (
                <li key={svc.href}>
                  <CareServiceCard svc={svc} delayMs={100 + (order.get(svc.href) ?? 0) * 40} />
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
