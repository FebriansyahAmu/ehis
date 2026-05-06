"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import TriaseModal from "./TriaseModal";

export default function IGDTriaseButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <TriaseModal open={open} onClose={() => setOpen(false)} />
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex shrink-0 items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 active:scale-95"
      >
        <Plus size={14} strokeWidth={2.5} />
        Triase
      </button>
    </>
  );
}
