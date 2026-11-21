"use client";

// Aksi "kirim resource ini saja" — di kaki kartu resource & kaki drawer detail kunjungan.
// Kartu: tombol ringkas (hasil lewat toast). Drawer: tombol + petunjuk + hasil INLINE (role alert/status),
// karena drawer = dialog modal dan toast di luarnya tak terbaca pembaca layar.

import { CircleCheck, CircleX, Info, Link2Off, Send, TriangleAlert, X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EncounterResourceDTO } from "@/lib/api/fhir/resources";
import { Button, TONE_SOFT } from "../fhirShared";
import type { ItemSendNotice, ItemSendTone } from "./useSendEncounterItem";

type Item = Pick<EncounterResourceDTO, "status" | "dependsOn" | "localType" | "ihsId">;

const SEND_LABEL = { new: "Kirim", changed: "Kirim perubahan" } as const;

function needsLabel(deps: string[]) {
  return `Kirim dulu: ${deps.join(", ")}`;
}

/** Kaki kartu: Terkirim (tanpa tombol) · prasyarat belum terkirim · tombol Kirim / Kirim perubahan. */
export function CardSendAction({ r, name, busy, disabled, onSend }: {
  r: Item;
  /** Nama data untuk nama aksesibel tombol (banyak tombol "Kirim" dalam satu halaman). */
  name: string;
  busy: boolean;
  disabled: boolean;
  onSend: () => void;
}) {
  if (r.status === "synced") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 font-semibold text-emerald-700">
        <CircleCheck size={12} aria-hidden /> Terkirim
      </span>
    );
  }
  if (r.dependsOn.length) {
    return (
      <span className="inline-flex min-w-0 items-center gap-1 font-semibold text-amber-700">
        <Link2Off size={12} className="shrink-0" aria-hidden />
        <span className="truncate">{needsLabel(r.dependsOn)}</span>
      </span>
    );
  }
  // Di atas overlay klik-kartu (::after tombol judul) agar tetap bisa ditekan.
  return (
    <span className="relative z-10 inline-flex shrink-0">
      <Button variant={r.status === "changed" ? "secondary" : "primary"} icon={Send} loading={busy} disabled={disabled} onClick={onSend}>
        {busy ? "Mengirim…" : SEND_LABEL[r.status]}
        <span className="sr-only"> {name}</span>
      </Button>
    </span>
  );
}

const NOTICE_TONE: Record<ItemSendTone, { tone: "emerald" | "sky" | "amber" | "rose"; icon: LucideIcon }> = {
  success: { tone: "emerald", icon: CircleCheck },
  info: { tone: "sky", icon: Info },
  warning: { tone: "amber", icon: TriangleAlert },
  error: { tone: "rose", icon: CircleX },
};

/** Hasil kirim di dalam drawer. Gagal = alert (diumumkan segera); lainnya = status (sopan). */
function NoticeBanner({ notice, onDismiss }: { notice: ItemSendNotice; onDismiss: () => void }) {
  const cfg = NOTICE_TONE[notice.tone];
  const Icon = cfg.icon;
  return (
    <div
      role={notice.tone === "error" ? "alert" : "status"}
      className={cn("flex w-full items-start gap-2 rounded-xl px-3 py-2.5 text-xs leading-relaxed", TONE_SOFT[cfg.tone])}
    >
      <Icon size={15} className="mt-0.5 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{notice.title}</p>
        {notice.message && <p className="mt-0.5 wrap-break-word opacity-90">{notice.message}</p>}
        {notice.issues.length > 0 && (
          <ul role="list" className="mt-1 list-disc pl-4 opacity-90">
            {notice.issues.map((x, i) => <li key={i} className="wrap-break-word">{x}</li>)}
          </ul>
        )}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Tutup notifikasi"
        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md opacity-70 outline-none transition hover:bg-white/60 hover:opacity-100 focus-visible:ring-2 focus-visible:ring-current"
      >
        <X size={13} aria-hidden />
      </button>
    </div>
  );
}

/** Kaki drawer: petunjuk + tombol kirim resource ini saja + hasil inline. */
export function DrawerSendFooter({ r, busy, disabled, notice, onDismiss, onSend }: {
  r: Item;
  busy: boolean;
  disabled: boolean;
  notice: ItemSendNotice | null;
  onDismiss: () => void;
  onSend: () => void;
}) {
  const blocked = r.dependsOn.length > 0;
  const hint = r.status === "synced"
    ? "Sudah sama dengan yang diterima SatuSehat — tidak perlu dikirim."
    : blocked
      ? `${needsLabel(r.dependsOn)} — resource ini merujuknya, tapi belum terkirim.`
      : r.localType === "Encounter" && !r.ihsId
        ? "Kirim Encounter ini saja. Bila diagnosa belum terkirim, Encounter dibuat in-progress dulu."
        : r.status === "changed"
          ? "Data berubah — kirim resource ini saja (PUT)."
          : "Kirim resource ini saja (POST), tanpa menunggu resource lain.";

  return (
    <div className="flex w-full flex-col gap-2">
      {notice && <NoticeBanner notice={notice} onDismiss={onDismiss} />}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="min-w-0 flex-1 text-[11px] text-slate-500">{hint}</p>
        {r.status !== "synced" && (
          <Button icon={Send} loading={busy} disabled={disabled || blocked} onClick={onSend}>
            {busy ? "Mengirim…" : r.status === "changed" ? "Kirim perubahan" : "Kirim resource ini"}
          </Button>
        )}
      </div>
    </div>
  );
}
