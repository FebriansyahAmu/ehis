"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type TriggerVariant = "default" | "filled";

/**
 * Kelas trigger picker. `default` = kartu putih border tipis (modal terang);
 * `filled` = field abu-abu h-10 rounded-xl (selaras form SEP `sInp`/`sSel`).
 * Dipisah per-state agar tidak ada utility yang bentrok (cn proyek = join saja).
 */
export function triggerClasses(variant: TriggerVariant, open: boolean): string {
  if (variant === "filled") {
    return cn(
      "flex h-10 w-full items-center gap-2 rounded-xl px-3 text-[13px] outline-none transition",
      open
        ? "border border-sky-400 bg-white ring-2 ring-sky-100"
        : "border border-transparent bg-slate-100 hover:bg-slate-200/70",
    );
  }
  return cn(
    "flex w-full items-center gap-2 rounded-lg border bg-white px-3 py-2 text-xs outline-none transition",
    open ? "border-sky-400 ring-2 ring-sky-100" : "border-slate-200 hover:border-slate-300",
  );
}

/**
 * Popover mengambang via portal + `position: fixed` agar tidak ter-clip oleh
 * kontainer ber-`overflow` (mis. body modal). Menangani positioning + flip,
 * reposisi saat scroll/resize, outside-click, dan Escape.
 *
 * @param popW  lebar popover (px). Diabaikan bila `matchWidth` true.
 * @param popH  perkiraan tinggi popover (px) untuk keputusan flip ke atas.
 * @param opts.matchWidth  samakan lebar popover dengan lebar trigger (untuk Select).
 */
export function usePopover(popW: number, popH: number, opts?: { matchWidth?: boolean }) {
  const matchWidth = opts?.matchWidth ?? false;
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const [width, setWidth] = useState(popW);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  const place = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const w = matchWidth ? r.width : popW;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let left = r.left;
    if (left + w > vw - 8) left = vw - 8 - w;
    if (left < 8) left = 8;
    let top = r.bottom + 6;
    if (top + popH > vh - 8 && r.top - popH - 6 > 8) top = r.top - popH - 6; // flip up
    setCoords({ top, left });
    setWidth(w);
  }, [popW, popH, matchWidth]);

  useLayoutEffect(() => {
    if (!open) return;
    place();
    const on = () => place();
    window.addEventListener("scroll", on, true);
    window.addEventListener("resize", on);
    return () => {
      window.removeEventListener("scroll", on, true);
      window.removeEventListener("resize", on);
    };
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (popRef.current?.contains(t) || triggerRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return { open, setOpen, mounted, coords, width, triggerRef, popRef };
}
