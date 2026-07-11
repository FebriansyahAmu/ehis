"use client";

// SpriIssuePanel — pembungkus tipis [SPRIPanel] (form penerbitan SPRI IGD) + pemuatan roster DPJP.
// Dipakai lintas konteks agar FORM PENERBITAN SPRI PERSIS SAMA:
//   · IGD (Pasien Pulang → Rawat Inap) langsung pakai SPRIPanel + roster ruangan;
//   · Registrasi (Admisi Rawat Inap → Buat SPRI) & Rawat Jalan (Disposisi → Admisi Rawat Inap)
//     pakai panel ini (tak ada roster ruangan → DPJP dari `dpjp-tersedia`, SMF/poli auto-derive
//     lewat jembatan `spesialistikFromSpesialisKode`).
//
// Sumber DPJP dipilih per HAK AKSES (bukan master.dokter — klinisi/loket tak punya master):
//   · dpjpScope="clinical" → GET /master/dpjp-tersedia (gate clinical.rekammedis:read) — RJ/IGD;
//   · dpjpScope="loket"    → GET /bpjs/dpjp-tersedia    (gate registration.kunjungan:read) — Registrasi.
// Panel HANYA emit `SpriInput` — pemanggilan `createSpri` + sumber kunjungan diurus parent.

import { useCallback, useEffect, useMemo, useState } from "react";
import { Braces } from "lucide-react";
import type { PetugasDTO } from "@/lib/api/penugasanRuangan";
import type { SpriInput } from "@/lib/schemas/disposisi/disposisi";
import type { InsertSPRIPayload } from "@/lib/bpjs/bpjsContracts";
import type { PulangPatient } from "@/components/igd/tabs/pasienPulang/pasienPulangShared";
import { spesialistikFromSpesialisKode } from "@/components/igd/tabs/pasienPulang/smfPoliMap";
import { listDpjpTersedia, listDpjpTersediaLoket, type DpjpTersediaDTO } from "@/lib/api/master/dpjpTersedia";
import { useSessionOptional } from "@/contexts/SessionContext";
import SPRIPanel from "@/components/igd/tabs/pasienPulang/SPRIPanel";
import SpriPayloadModal from "@/components/shared/spri/SpriPayloadModal";

export default function SpriIssuePanel({
  patient,
  onChange,
  submitHint,
  dpjpScope = "clinical",
}: {
  patient: PulangPatient;
  onChange: (spri: SpriInput | null) => void;
  submitHint?: React.ReactNode;
  /** Sumber daftar DPJP sesuai hak akses konteks. Default "clinical" (RJ/IGD). */
  dpjpScope?: "clinical" | "loket";
}) {
  const [dpjp, setDpjp] = useState<DpjpTersediaDTO[]>([]);
  const [latest, setLatest] = useState<SpriInput | null>(null); // SpriInput valid terakhir (utk pratinjau payload)
  const [payloadOpen, setPayloadOpen] = useState(false);
  // Sesi login (nama petugas) — optional: null di konteks tanpa SessionProvider (mis. modal Registrasi).
  const currentUser = useSessionOptional()?.session?.namaTampil ?? "";

  useEffect(() => {
    const ac = new AbortController();
    const fetchDpjp = dpjpScope === "loket" ? listDpjpTersediaLoket : listDpjpTersedia;
    fetchDpjp(ac.signal)
      .then((rows) => setDpjp(rows))
      .catch(() => { /* dropdown DPJP opsional → SPRIPanel tetap tampil */ });
    return () => ac.abort();
  }, [dpjpScope]);

  // Intersep emit SPRIPanel: simpan salinan lokal (pratinjau payload) + teruskan ke parent.
  const handleChange = useCallback((spri: SpriInput | null) => {
    setLatest(spri);
    onChange(spri);
  }, [onChange]);

  // Pratinjau body RencanaKontrol/InsertSPRI. kodeDokter = kode DPJP BPJS (Mapping Hub) dari DPJP
  // terpilih (kosong bila belum di-map); user = akun login; noKartu ter-mask (server pakai penuh).
  const payload = useMemo<InsertSPRIPayload>(() => ({
    noKartu: patient.noBpjs ?? "",
    kodeDokter: dpjp.find((d) => d.pegawaiId === latest?.dpjpPegawaiId)?.kodeBpjs ?? "",
    poliKontrol: latest?.poliKode ?? "",
    tglRencanaKontrol: latest?.tglRencanaRawat ?? "",
    user: currentUser,
  }), [patient.noBpjs, latest, dpjp, currentUser]);

  const dokterOptions = useMemo<string[]>(() => dpjp.map((d) => d.nama), [dpjp]);
  // Roster sintetis dari dpjp-tersedia: spesialistik dijembatani SpesialisKode → label
  // SPESIALISTIK_OPTS agar SMF/poli auto-derive SPRIPanel bekerja seperti di IGD.
  const roster = useMemo<PetugasDTO[]>(
    () => dpjp.map((d) => ({
      pegawaiId: d.pegawaiId,
      namaTampil: d.nama,
      profesi: "Dokter",
      spesialistik: spesialistikFromSpesialisKode(d.spesialisKode),
      ruanganKode: null,
      ruanganNama: null,
    })),
    [dpjp],
  );

  return (
    <div className="flex flex-col gap-2">
      <SPRIPanel
        patient={patient}
        dokterOptions={dokterOptions}
        roster={roster}
        onChange={handleChange}
        submitHint={submitHint}
      />

      {/* Hyperlink pratinjau payload SPRI (RencanaKontrol/InsertSPRI) */}
      <div className="flex items-center justify-end px-1">
        <button
          type="button"
          onClick={() => setPayloadOpen(true)}
          disabled={!latest}
          title={latest ? "Lihat body request RencanaKontrol/InsertSPRI" : "Lengkapi form SPRI dulu"}
          className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500 underline decoration-dotted underline-offset-2 transition hover:text-slate-700 disabled:cursor-not-allowed disabled:text-slate-300 disabled:no-underline"
        >
          <Braces size={12} /> Lihat payload SPRI
        </button>
      </div>

      {payloadOpen && (
        <SpriPayloadModal payload={{ request: payload }} onClose={() => setPayloadOpen(false)} />
      )}
    </div>
  );
}
