"use client";

import { Lock, Clock } from "lucide-react";
import type { SoftLock } from "@/lib/eklaim/eklaimShared";

interface Props {
  softLock: SoftLock;
}

function remainingMinutes(expiresAt: string): number {
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 60_000));
}

export default function SoftLockBanner({ softLock }: Props) {
  const remaining = remainingMinutes(softLock.expiresAt);

  return (
    <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 ring-1 ring-amber-200">
        <Lock size={14} strokeWidth={2.5} className="text-amber-700" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-amber-900">
          Sedang di-edit oleh{" "}
          <span className="font-bold">{softLock.lockedBy}</span>
        </p>
        <p className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-amber-700">
          <Clock size={11} strokeWidth={2} className="shrink-0" />
          Lock berakhir dalam{" "}
          <span className="font-mono font-semibold tabular-nums">
            {remaining} menit
          </span>{" "}
          · Anda hanya dapat melihat, tidak bisa mengedit
        </p>
      </div>
      <span className="shrink-0 rounded-md bg-amber-100 px-2 py-1 text-[11.5px] font-semibold text-amber-700 ring-1 ring-amber-200">
        Lihat Saja
      </span>
    </div>
  );
}
