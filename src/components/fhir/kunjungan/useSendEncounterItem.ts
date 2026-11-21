"use client";

// Kirim 1 resource milik kunjungan ke SatuSehat + notifikasi hasil. Dipakai kartu resource & drawer.
// Sibuk per item (bukan global) → dobel klik diabaikan. Server mengunci per kunjungan, jadi kirim
// item lain saat satu item masih berjalan ditolak 409 (dilaporkan sebagai gagal, data aman).
//
// Notifikasi: kartu → toast (aria-live di ToastViewport). Drawer = dialog MODAL → area di luarnya
// inert bagi pembaca layar, jadi hasil dari drawer ditampilkan INLINE (`inline: true`), bukan toast.

import { useCallback, useRef, useState } from "react";
import { toast } from "@/lib/ui/toastStore";
import { sendEncounterItem, type EncounterItemSyncDTO } from "@/lib/api/fhir/resources";
import { errMsg } from "../fhirShared";

export type ItemSendTone = "success" | "info" | "warning" | "error";
export interface ItemSendNotice {
  tone: ItemSendTone;
  title: string;
  message: string;
  issues: string[];
}

export const itemKey = (x: { localType: string; localId: string }) => `${x.localType}|${x.localId}`;

/** Kata-kata hasil kirim — sama untuk toast & alert inline. */
export function describeItemResult(r: EncounterItemSyncDTO, label: string): ItemSendNotice {
  const issues = r.issues;
  switch (r.outcome) {
    case "created":
      return { tone: "success", title: `Terkirim — ${label}`, message: r.message, issues };
    case "updated":
      return { tone: "success", title: `Diperbarui — ${label}`, message: r.message, issues };
    case "unchanged":
      return { tone: "info", title: `Tidak dikirim — ${label}`, message: r.message, issues };
    case "blocked":
      return { tone: "warning", title: `Belum bisa dikirim — ${label}`, message: r.message, issues };
    case "skipped":
      return { tone: "warning", title: `Dilewati — ${label}`, message: r.message, issues };
    case "failed":
      return { tone: "error", title: `Gagal dikirim — ${label}`, message: r.message, issues };
  }
}

export function useSendEncounterItem(kunjunganId: string, onSent?: (r: EncounterItemSyncDTO) => void) {
  const [busy, setBusy] = useState<ReadonlySet<string>>(new Set());
  /** Hasil terakhir per item untuk tampilan inline (drawer). */
  const [notice, setNotice] = useState<{ key: string; n: ItemSendNotice } | null>(null);
  /** Naik tiap kirim selesai (berhasil/gagal) → panel log pengiriman dimuat ulang. */
  const [version, setVersion] = useState(0);
  const inflight = useRef(new Set<string>());

  const send = useCallback(
    async (item: { localType: string; localId: string }, label: string, o: { inline?: boolean } = {}) => {
      const key = itemKey(item);
      if (inflight.current.has(key)) return null;
      inflight.current.add(key);
      setBusy(new Set(inflight.current));
      setNotice((x) => (x?.key === key ? null : x));
      let n: ItemSendNotice;
      let res: EncounterItemSyncDTO | null = null;
      try {
        res = await sendEncounterItem(kunjunganId, { localType: item.localType, localId: item.localId });
        n = describeItemResult(res, label);
      } catch (e) {
        n = { tone: "error", title: `Gagal dikirim — ${label}`, message: errMsg(e) ?? "Permintaan gagal", issues: [] };
      } finally {
        inflight.current.delete(key);
        setBusy(new Set(inflight.current));
        setVersion((v) => v + 1);
      }
      if (o.inline) setNotice({ key, n });
      else toast[n.tone](n.title, [n.message, ...n.issues].filter(Boolean).join(" · ") || undefined);
      // Status kartu/progres hanya berubah bila ada yang diterima SatuSehat.
      if (res && (res.outcome === "created" || res.outcome === "updated")) onSent?.(res);
      return res;
    },
    [kunjunganId, onSent],
  );

  const dismiss = useCallback(() => setNotice(null), []);
  return { send, busy, notice, dismiss, version };
}
