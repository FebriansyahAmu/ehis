"use client";

// Kirim 1 data Prerequisites ke SatuSehat + notifikasi hasil. Dipakai daftar data & drawer detail.
// Status sibuk per item (bukan global) → item lain tetap bisa dikirim; dobel klik diabaikan.
//
// Notifikasi: daftar → toast (aria-live di ToastViewport). Drawer = dialog MODAL → area di luarnya
// inert bagi pembaca layar, jadi hasil ditampilkan INLINE di dalam drawer (`mode: "inline"`), bukan toast.

import { useCallback, useRef, useState } from "react";
import { toast } from "@/lib/ui/toastStore";
import { sendPrereqItem, type OnboardingItemSendDTO, type PrereqJenis } from "@/lib/api/fhir/onboarding";
import { errMsg } from "../fhirShared";

const RESOURCE: Record<PrereqJenis, string> = {
  organization: "Organization",
  location: "Location",
  practitioner: "Practitioner",
  patient: "Patient",
};

export type SendTone = "success" | "info" | "warning" | "error";
export interface SendNotice {
  tone: SendTone;
  title: string;
  message: string;
}

/** Kata-kata hasil kirim — sama untuk toast & alert inline. */
export function describeSendResult(r: OnboardingItemSendDTO): SendNotice {
  const { item } = r;
  const rt = RESOURCE[r.jenis];
  const who = `${rt} · ${item.nama}`;
  const ihs = item.ihsId ? `IHS id ${item.ihsId}` : "";
  const getOnly = r.jenis === "practitioner" || r.jenis === "patient";
  switch (item.outcome) {
    case "created":
      return { tone: "success", title: `Berhasil dikirim — ${who}`, message: `POST ${rt} diterima SatuSehat. ${ihs}`.trim() };
    case "updated":
      return { tone: "success", title: `Berhasil diperbarui — ${who}`, message: `PUT ${rt}/${item.ihsId ?? "?"} diterima SatuSehat.` };
    case "resolved":
      return { tone: "success", title: `Berhasil dipetakan — ${who}`, message: [item.message, ihs].filter(Boolean).join(" · ") };
    case "unchanged":
      return {
        tone: "info",
        title: `Tidak dikirim — ${who}`,
        message: `${item.message ?? "Tidak ada perubahan"}. ${getOnly ? 'Pakai "Cari ulang IHS" di Detail untuk mencari ulang.' : 'Pakai "Kirim ulang" di Detail untuk memaksa PUT.'}`,
      };
    case "skipped":
      return { tone: "warning", title: `Dilewati — ${who}`, message: item.message ?? "" };
    case "failed":
      return { tone: "error", title: `Gagal dikirim — ${who}`, message: item.message ?? "SatuSehat menolak permintaan. Lihat tab Log pengiriman." };
  }
}

export function useSendPrereqItem(
  jenis: PrereqJenis,
  onSent?: (r: OnboardingItemSendDTO) => void,
  opts: { mode?: "toast" | "inline" } = {},
) {
  const mode = opts.mode ?? "toast";
  const [busy, setBusy] = useState<ReadonlySet<string>>(new Set());
  /** Hasil terakhir per item (mode inline). */
  const [notice, setNotice] = useState<{ localId: string; n: SendNotice } | null>(null);
  const inflight = useRef(new Set<string>());

  const announce = useCallback(
    (localId: string, n: SendNotice) => {
      if (mode === "inline") setNotice({ localId, n });
      else toast[n.tone](n.title, n.message || undefined);
    },
    [mode],
  );

  const send = useCallback(
    async (localId: string, label: string, o: { force?: boolean } = {}) => {
      if (inflight.current.has(localId)) return null;
      inflight.current.add(localId);
      setBusy(new Set(inflight.current));
      setNotice((x) => (x?.localId === localId ? null : x));
      try {
        const r = await sendPrereqItem(jenis, localId, o);
        announce(localId, describeSendResult(r));
        onSent?.(r);
        return r;
      } catch (e) {
        announce(localId, { tone: "error", title: `Gagal dikirim — ${RESOURCE[jenis]} · ${label}`, message: errMsg(e) ?? "Permintaan ke server EHIS gagal" });
        return null;
      } finally {
        inflight.current.delete(localId);
        setBusy(new Set(inflight.current));
      }
    },
    [jenis, onSent, announce],
  );

  return {
    send,
    isBusy: (localId: string) => busy.has(localId),
    noticeFor: (localId: string) => (notice?.localId === localId ? notice.n : null),
    clearNotice: () => setNotice(null),
  };
}
