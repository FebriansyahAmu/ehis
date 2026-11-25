"use client";

// Kartu "Panggilan terbaru" Beranda BPJS: 6 panggilan terakhir ke V-Claim/Aplicares (diperbarui
// langsung dari auditStore), waktu relatif. Klik baris → Sheet detail yang sama dengan Audit trail
// (rantai percobaan, sidik hash); "Lihat semua panggilan ke endpoint ini" membuka Audit trail yang
// sudah tersaring ke endpoint tersebut.
// Komponen shadcn: Card · Item · Button · Sheet · Empty · Skeleton.

import { useId, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { KepalaKartu, KerangkaDaftar, KosongData } from "@/components/bpjs/shared/daftarUi";
import { KARTU } from "@/components/bpjs/shared/vclaimUi";
import AuditSheet from "@/components/bpjs/audit/AuditSheet";
import BarisAudit from "@/components/bpjs/audit/BarisAudit";
import { urlAudit } from "@/components/bpjs/audit/auditShared";
import { waktuRelatif } from "@/components/bpjs/aplicares/ketersediaanShared";
import type { BPJSAuditEntry } from "@/lib/bpjs/bpjsShared";

const TAMPIL = 6;

export default function KartuPanggilan({ siap, log, sekarang }: { siap: boolean; log: readonly BPJSAuditEntry[]; sekarang: number }) {
  const id = useId();
  const router = useRouter();
  const [buka, setBuka] = useState<BPJSAuditEntry | null>(null);
  const terbaru = log.slice(0, TAMPIL);

  return (
    <Card className={KARTU}>
      <section className="flex flex-col gap-3 py-4">
        <KepalaKartu judulId={`${id}-judul`} judul="Panggilan terbaru" deskripsi="Diperbarui langsung setiap ada panggilan · pilih untuk melihat detail">
          <Button asChild variant="ghost" size="xs" className="text-emerald-800 hover:text-emerald-900">
            <Link href={urlAudit()}>
              Audit trail
              <ArrowUpRight aria-hidden="true" />
            </Link>
          </Button>
        </KepalaKartu>

        <div className="px-2">
          {!siap ? (
            <KerangkaDaftar baris={4} tinggi="h-12" />
          ) : terbaru.length === 0 ? (
            <KosongData ikon={ScrollText} judul="Belum ada panggilan BPJS" deskripsi="Setiap panggilan ke V-Claim dan Aplicares akan muncul di sini." />
          ) : (
            <ul className="flex flex-col gap-0.5">
              {terbaru.map((e, i) => (
                <BarisAudit
                  key={e.id}
                  e={e}
                  index={i}
                  onBuka={() => setBuka(e)}
                  waktu={<time dateTime={e.timestamp}>{waktuRelatif(e.timestamp, sekarang)}</time>}
                />
              ))}
            </ul>
          )}
        </div>
      </section>

      <AuditSheet
        entri={buka}
        semua={log}
        onClose={() => setBuka(null)}
        onSaringEndpoint={(endpoint) => {
          setBuka(null);
          router.push(urlAudit({ q: endpoint }));
        }}
      />
    </Card>
  );
}
