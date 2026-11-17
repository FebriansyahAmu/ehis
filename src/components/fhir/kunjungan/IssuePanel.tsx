"use client";

// Panel "Data ditahan" (FHIR-GAP FG-91): Issue gerbang readiness per link (docs/fhir-mapping/FLOW.md §4),
// dikelompokkan per link L01–L26. Item ditahan TIDAK dikirim dan TIDAK menggagalkan job; lengkapi datanya
// agar ikut terkirim pada sinkron berikutnya. `syarat-finished` (Encounter ditahan in-progress) di atas.

import { OctagonAlert } from "lucide-react";
import type { Issue, IssueCode, LinkId } from "@/lib/fhir/links/types";
import { LINK_BY_ID } from "@/lib/fhir/links/registry";
import { Pill, SectionCard, type Tone } from "../fhirShared";

const CODE: Record<IssueCode, { label: string; tone: Tone }> = {
  "syarat-finished": { label: "Syarat selesai", tone: "rose" },
  "kode-kosong": { label: "Kode kosong", tone: "amber" },
  "kode-tidak-valid": { label: "Kode tidak valid", tone: "rose" },
  "kategori-salah": { label: "Kategori salah", tone: "rose" },
  "nakes-tanpa-ihs": { label: "Nakes tanpa IHS", tone: "sky" },
  "di-luar-playbook": { label: "Di luar playbook", tone: "slate" },
  "menunggu-keputusan": { label: "Menunggu keputusan", tone: "amber" },
};

export function IssuePanel({ issues }: { issues: Issue[] }) {
  if (!issues.length) return null;

  const hold = issues.filter((i) => i.code === "syarat-finished");
  const byLink = new Map<LinkId, Issue[]>();
  for (const i of issues) {
    if (i.code === "syarat-finished") continue;
    byLink.set(i.link, [...(byLink.get(i.link) ?? []), i]);
  }
  const groups = [...byLink.entries()].sort(([a], [b]) => a.localeCompare(b));

  return (
    <SectionCard title="Data ditahan" desc={`${issues.length} item belum dikirim — lengkapi datanya agar ikut terkirim`}>
      {hold.length > 0 && (
        <div className="border-b border-rose-100 bg-rose-50/70 px-4 py-2.5 text-[11.5px] leading-snug text-rose-800" role="status">
          <p className="flex items-center gap-1.5 font-semibold">
            <OctagonAlert size={13} className="shrink-0" aria-hidden /> Kunjungan belum bisa dikirim berstatus selesai
          </p>
          <ul className="mt-1 list-disc pl-5">
            {hold.map((i, n) => <li key={n}>{i.message.replace(/^Encounter ditahan in-progress — /, "")}</li>)}
          </ul>
        </div>
      )}
      <ul className="divide-y divide-slate-100">
        {groups.map(([link, items]) => {
          const meta = LINK_BY_ID[link];
          return (
            <li key={link} className="px-4 py-2.5">
              <p className="text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">
                {link}{meta ? ` · ${meta.resourceTypes.join(", ")}` : ""}
              </p>
              <ul className="mt-1.5 flex flex-col gap-1.5">
                {items.map((i, n) => (
                  <li key={n} className="flex items-start gap-2 text-[11.5px] leading-snug text-slate-700">
                    <Pill label={CODE[i.code].label} tone={CODE[i.code].tone} />
                    <span className="min-w-0">{i.message}</span>
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ul>
    </SectionCard>
  );
}
