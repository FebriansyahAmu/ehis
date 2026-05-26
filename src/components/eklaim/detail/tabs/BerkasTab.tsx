"use client";

/**
 * BerkasTab — main orchestrator untuk Tab Berkas di Klaim Detail (EK3.2).
 *
 * Layout (lg+):
 *   ┌────────────────────────────────────────────────────┐
 *   │ AutoPullBar (4 source buttons + Pull Semua)        │
 *   ├──────────────────────┬─────────────────────────────┤
 *   │ BerkasGroupList      │ BerkasPreviewPane           │
 *   │ (5/12 · scroll left) │ (7/12 · sticky right)       │
 *   └──────────────────────┴─────────────────────────────┘
 *
 * State lokal:
 *  - berkas: mutable mirror dari claim.berkas (demo only — backend swap later)
 *  - selectedId: berkas yang sedang di-preview
 *
 * Mock interactions:
 *  - Status cycle: Belum → Siap → Tidak Berlaku → Belum
 *  - Auto-pull: set status Siap + attach mock file (latency 350ms simulasi)
 *  - Upload: hidden file input → mock file dengan nama asli
 *  - Note change: update catatan
 */

import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, AlertCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { computeBerkasProgress } from "../claimDetailShared";
import { getBerkasTemplate } from "@/lib/eklaim/berkasTemplatesMock";
import AutoPullBar from "./berkas/AutoPullBar";
import BerkasGroupList from "./berkas/BerkasGroupList";
import BerkasPreviewPane from "./berkas/BerkasPreviewPane";
import {
  AUTO_PULL_KATEGORI,
  cycleStatus,
  makeMockFile,
} from "./berkas/berkasShared";
import type {
  BerkasKategori,
  BerkasKlaim,
  ClaimRecord,
} from "@/lib/eklaim/eklaimShared";

interface Props {
  claim: ClaimRecord;
}

const MOCK_CODER = "Lina (Coder RM)";

export default function BerkasTab({ claim }: Props) {
  const [berkas, setBerkas] = useState<ReadonlyArray<BerkasKlaim>>(claim.berkas);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingUploadIdRef = useRef<string | null>(null);

  // Template lookup untuk catatanKhusus tooltip per row
  const templateNotes = useMemo(() => {
    const template = getBerkasTemplate(claim.penjamin.tipe, claim.tipePelayanan);
    const map: Record<string, string | undefined> = {};
    berkas.forEach((b) => {
      const tpl = template.find(
        (t) => t.kategori === b.kategori && t.nama === b.nama,
      );
      map[b.id] = tpl?.catatanKhusus;
    });
    return map;
  }, [berkas, claim.penjamin.tipe, claim.tipePelayanan]);

  const selected = useMemo(
    () => berkas.find((b) => b.id === selectedId) ?? null,
    [berkas, selectedId],
  );

  const overallProgress = useMemo(
    () => computeBerkasProgress(berkas),
    [berkas],
  );

  // ── Handlers ───────────────────────────────────────────

  const handleSelect = (id: string) => setSelectedId(id);

  const handleStatusCycle = (id: string) => {
    setBerkas((prev) =>
      prev.map((b) =>
        b.id === id ? { ...b, status: cycleStatus(b.status) } : b,
      ),
    );
  };

  const handleNoteChange = (id: string, note: string) => {
    setBerkas((prev) =>
      prev.map((b) => (b.id === id ? { ...b, catatan: note } : b)),
    );
  };

  const handleAutoPull = (id: string) => {
    const target = berkas.find((b) => b.id === id);
    if (!target) return;

    // Simulasi latency 350ms biar terasa async
    setTimeout(() => {
      setBerkas((prev) =>
        prev.map((b) =>
          b.id === id
            ? {
                ...b,
                status: "Siap" as const,
                file: makeMockFile(b.kategori, b.id, "Auto-pull · System"),
                sumber: {
                  type: "auto-pull" as const,
                  sumberType:
                    b.kategori === "ResumeMedis"
                      ? "discharge" as const
                      : b.kategori === "Lab"
                        ? "lab-order" as const
                        : b.kategori === "Rad"
                          ? "rad-order" as const
                          : "billing" as const,
                  id: claim.id,
                },
                uploadedBy: "Auto-pull · System",
                uploadedAt: new Date().toISOString(),
              }
            : b,
        ),
      );
    }, 350);
  };

  const handlePullKategori = (kategori: BerkasKategori) => {
    const ids = berkas.filter((b) => b.kategori === kategori).map((b) => b.id);
    ids.forEach((id, i) => {
      setTimeout(() => handleAutoPull(id), 100 + i * 150);
    });
  };

  const handlePullAll = () => {
    AUTO_PULL_KATEGORI.forEach((kat, i) => {
      setTimeout(() => handlePullKategori(kat), i * 200);
    });
  };

  const handleUpload = (id: string) => {
    pendingUploadIdRef.current = id;
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const id = pendingUploadIdRef.current;
    if (!file || !id) return;

    setBerkas((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;
        const newVersionNum = (b.file?.versions.length ?? 0) + 1;
        const mockFile = makeMockFile(b.kategori, b.id, MOCK_CODER);
        return {
          ...b,
          status: "Siap" as const,
          file: {
            ...mockFile,
            url: `/mock/berkas/${b.id}/${file.name}`,
            sizeBytes: file.size,
            mimeType: file.type || mockFile.mimeType,
            versions: [
              ...(b.file?.versions ?? []),
              {
                versionNumber: newVersionNum,
                url: `/mock/berkas/${b.id}/${file.name}`,
                uploadedBy: MOCK_CODER,
                uploadedAt: new Date().toISOString(),
                replacedReason: b.file ? "Replace via upload manual" : undefined,
              },
            ],
          },
          sumber: { type: "upload-manual" as const },
          uploadedBy: MOCK_CODER,
          uploadedAt: new Date().toISOString(),
        };
      }),
    );

    pendingUploadIdRef.current = null;
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Render ─────────────────────────────────────────────

  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="flex w-full flex-col gap-3"
    >
      {/* Hidden file input untuk upload stub */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={handleFileInputChange}
        className="hidden"
        aria-hidden
      />

      {/* AutoPullBar */}
      <AutoPullBar
        claim={claim}
        berkas={berkas}
        onPullKategori={handlePullKategori}
        onPullAll={handlePullAll}
      />

      {/* Global progress banner */}
      <ProgressBanner
        readyWajib={overallProgress.readyWajib}
        totalWajib={overallProgress.totalWajib}
        percent={overallProgress.percent}
        isComplete={overallProgress.isComplete}
        missingCount={overallProgress.missingKategori.length}
      />

      {/* 2-pane body */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-12">
        <div className="min-h-0 lg:col-span-5 lg:max-h-[calc(100vh-400px)]">
          <BerkasGroupList
            berkas={berkas}
            templateNotes={templateNotes}
            selectedId={selectedId}
            onSelect={handleSelect}
            onStatusCycle={handleStatusCycle}
            onUpload={handleUpload}
            onAutoPull={handleAutoPull}
            onNoteChange={handleNoteChange}
          />
        </div>
        <div className="min-h-0 lg:col-span-7 lg:max-h-[calc(100vh-400px)]">
          <BerkasPreviewPane
            berkas={selected}
            onUpload={handleUpload}
            onAutoPull={handleAutoPull}
          />
        </div>
      </div>
    </motion.section>
  );
}

// ── Progress Banner ────────────────────────────────────

function ProgressBanner({
  readyWajib,
  totalWajib,
  percent,
  isComplete,
  missingCount,
}: {
  readyWajib: number;
  totalWajib: number;
  percent: number;
  isComplete: boolean;
  missingCount: number;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3 rounded-lg border px-3 py-2",
        isComplete
          ? "border-emerald-200 bg-emerald-50/60"
          : "border-amber-200 bg-amber-50/60",
      )}
    >
      <span
        className={cn(
          "inline-flex h-7 w-7 items-center justify-center rounded-md ring-1",
          isComplete
            ? "bg-emerald-100 ring-emerald-200"
            : "bg-amber-100 ring-amber-200",
        )}
      >
        {isComplete ? (
          <CheckCircle2 size={13} strokeWidth={2.4} className="text-emerald-700" />
        ) : (
          <AlertCircle size={13} strokeWidth={2.4} className="text-amber-700" />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-[12.5px] font-bold",
            isComplete ? "text-emerald-800" : "text-amber-800",
          )}
        >
          {isComplete
            ? "Semua berkas wajib siap — klaim layak submit"
            : `${missingCount} berkas wajib belum siap`}
        </p>
        <p className="text-[11.5px] text-slate-600">
          <span className="font-mono font-semibold tabular-nums">
            {readyWajib}/{totalWajib}
          </span>{" "}
          wajib siap · {percent}% kelengkapan global
        </p>
      </div>

      {/* Progress bar */}
      <div className="hidden h-1.5 w-32 overflow-hidden rounded-full bg-white ring-1 ring-slate-200 sm:block">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className={cn(
            "h-full rounded-full",
            isComplete
              ? "bg-linear-to-r from-emerald-400 to-emerald-500"
              : "bg-linear-to-r from-amber-400 to-amber-500",
          )}
        />
      </div>
    </div>
  );
}
