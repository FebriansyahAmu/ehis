"use client";

import type { SepDraft } from "@/components/registration/kunjungan/Tabs/sep/sepTypes";
import { SepStep2, SepStep3 } from "@/components/registration/kunjungan/Tabs/sep/SepSteps";

/** Step SEP — mengadopsi flow penerbitan: data kunjungan SEP (SepStep2) + jaminan/laka (SepStep3). */
export function StepSEP({
  draft, setDraft,
}: {
  draft: SepDraft;
  setDraft: React.Dispatch<React.SetStateAction<SepDraft>>;
}) {
  return (
    <div className="space-y-4">
      <SepStep2 draft={draft} setDraft={setDraft} />
      <SepStep3 draft={draft} setDraft={setDraft} />
    </div>
  );
}
