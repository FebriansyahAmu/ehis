"use client";

// Petakan manual data ini → Nomor IHS (KHUSUS mode Sandbox): NIK data asli RS tak ada di Sandbox, padahal
// resource lain (Encounter, Condition, …) butuh referensi Practitioner/Patient yang valid untuk diuji.
// Konfirmasi INLINE 2 langkah — drawer sudah dialog modal (Radix); dialog bertumpuk berisiko bentrok
// focus trap. Tombol "Ya, petakan" muncul di baris BERBEDA dari pemicu (klik ganda tak langsung
// mengonfirmasi) dan fokus pindah ke aksi aman (Batal). Server tetap menolak di luar Sandbox.

import { useEffect, useId, useRef, useState } from "react";
import { CircleCheck, Info, Link2, TriangleAlert, Users } from "lucide-react";
import { mapIhs, type IhsLookupDTO, type IhsMapDTO } from "@/lib/api/fhir/ihsLookup";
import { Button, Pill, errMsg } from "../fhirShared";
import { Callout } from "../resource/resourceUi";

type Phase = "idle" | "confirm" | "busy" | "done";

export function IhsMapAction({
  r,
  localId,
  onMapped,
}: {
  /** Hasil GET by IHS yang ditemukan (mode sandbox). */
  r: IhsLookupDTO;
  /** Data lokal yang sedang dilihat. */
  localId: string;
  onMapped: (m: IhsMapDTO) => void;
}) {
  const titleId = useId();
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<IhsMapDTO | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);
  const prevPhase = useRef<Phase>("idle");

  // Tombol yang difokus lenyap di tiap langkah → pindahkan fokus agar tak jatuh ke <body>.
  useEffect(() => {
    const prev = prevPhase.current;
    prevPhase.current = phase;
    if (phase === "confirm") (prev === "busy" ? confirmRef : cancelRef).current?.focus();
    else if (phase === "done") doneRef.current?.focus();
    else if (phase === "idle" && prev === "confirm") triggerRef.current?.focus();
  }, [phase]);

  async function confirm() {
    if (phase === "busy") return;
    setPhase("busy");
    setError(null);
    try {
      const m = await mapIhs({ resourceType: r.resourceType, ihsId: r.ihsId, localId });
      setDone(m);
      setPhase("done");
      onMapped(m);
    } catch (e) {
      setError(errMsg(e) ?? "Gagal memetakan — coba lagi");
      setPhase("confirm");
    }
  }

  if (done) {
    return (
      <div ref={doneRef} tabIndex={-1} className="rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-teal-300">
        <Callout tone="emerald" icon={CircleCheck}>
          Tersimpan (Sandbox) — <b>{done.lokal.label}</b> kini merujuk <span className="font-mono">{done.resourceType}/{done.ihsId}</span> untuk
          resource lain (Encounter, dst.).
          {done.sebelumnya && done.sebelumnya !== done.ihsId && <> Peta lama <span className="font-mono">{done.sebelumnya}</span> diganti.</>}
          {done.dipakaiJuga && <> IHS ini juga dipakai <b>{done.dipakaiJuga.label}</b>.</>}
        </Callout>
      </div>
    );
  }
  if (r.cocok === true) return null; // sudah terpetakan ke IHS ini

  const replacing = r.cocok === false ? r.ihsTerpetakan : null;
  const shared = r.lokal && r.lokal.localId !== localId ? r.lokal : null;

  return (
    <section aria-labelledby={titleId} className="rounded-xl border border-teal-200 bg-teal-50/40">
      <div className="flex flex-wrap items-start justify-between gap-3 px-3 py-2.5">
        <div className="min-w-0 flex-1">
          <h4 id={titleId} className="flex flex-wrap items-center gap-1.5 text-xs font-bold text-slate-800">
            <Link2 size={13} className="text-teal-700" aria-hidden />
            {replacing ? "Ganti peta data ini" : "Petakan data ini"} ke IHS <span className="font-mono">{r.ihsId}</span>
            <Pill label="Khusus Sandbox" tone="amber" />
          </h4>
          <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">
            NIK data RS tidak ada di Sandbox, jadi Cari IHS tak akan ketemu. Petakan ke IHS dummy agar resource lain
            (Encounter, Condition, dst.) bisa diuji. Hanya menyimpan peta di EHIS — tidak mengirim data ke SatuSehat.
          </p>
        </div>
        {phase === "idle" && (
          <Button ref={triggerRef} variant="secondary" icon={Link2} onClick={() => { setError(null); setPhase("confirm"); }}>
            {replacing ? "Ganti peta…" : "Petakan…"}
          </Button>
        )}
      </div>

      {phase !== "idle" && (
        <div className="border-t border-teal-100 px-3 py-2.5">
          <ul className="flex flex-col gap-1.5 text-[11px] leading-relaxed text-slate-600">
            {replacing && (
              <li className="flex gap-1.5">
                <TriangleAlert size={12} className="mt-0.5 shrink-0 text-amber-600" aria-hidden />
                <span>Peta lama ke <span className="font-mono">{replacing}</span> akan diganti.</span>
              </li>
            )}
            {shared && (
              <li className="flex gap-1.5">
                <Users size={12} className="mt-0.5 shrink-0 text-amber-600" aria-hidden />
                <span>
                  IHS ini sudah dipakai <b>{shared.label}</b>. Di Sandbox boleh dipakai bersama, tetapi resource kedua data
                  akan merujuk {r.resourceType} yang sama.
                </span>
              </li>
            )}
            <li className="flex gap-1.5">
              <Info size={12} className="mt-0.5 shrink-0 text-slate-400" aria-hidden />
              <span>IHS diverifikasi ulang ke SatuSehat sebelum disimpan dan tercatat di Log pengiriman.</span>
            </li>
          </ul>
          <div className="mt-2.5 flex flex-wrap items-center justify-end gap-2">
            <Button ref={cancelRef} variant="ghost" disabled={phase === "busy"} onClick={() => { setError(null); setPhase("idle"); }}>
              Batal
            </Button>
            <Button ref={confirmRef} icon={Link2} loading={phase === "busy"} onClick={() => void confirm()}>
              {phase === "busy" ? "Memetakan…" : replacing ? "Ya, ganti peta" : "Ya, petakan"}
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div role="alert" className="px-3 pb-2.5">
          <Callout tone="rose" icon={TriangleAlert}>{error}</Callout>
        </div>
      )}
    </section>
  );
}
