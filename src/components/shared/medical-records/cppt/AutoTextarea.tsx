"use client";

// Textarea yang tingginya mengikuti isi. Utama: CSS `field-sizing: content` (lebar tetap 100% agar
// tak "melompat" horizontal; tinggi dibatasi min/max — melewati max → gulir di dalam). Peramban yang
// belum mendukung (Baseline baru 2026) → fallback JS: ukur `scrollHeight` tiap nilai berubah.

import { forwardRef, useImperativeHandle, useLayoutEffect, useRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/ui/utils";

const supportsFieldSizing = () =>
  typeof CSS !== "undefined" && typeof CSS.supports === "function" && CSS.supports("field-sizing", "content");

export const AutoTextarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { value: string }>(
  function AutoTextarea({ className, value, ...props }, ref) {
    const inner = useRef<HTMLTextAreaElement>(null);
    useImperativeHandle(ref, () => inner.current as HTMLTextAreaElement);

    useLayoutEffect(() => {
      const el = inner.current;
      if (!el || supportsFieldSizing()) return;
      el.style.height = "auto";
      const max = parseFloat(getComputedStyle(el).maxHeight) || Infinity;
      const border = el.offsetHeight - el.clientHeight;
      el.style.height = `${Math.min(el.scrollHeight + border, max)}px`;
    }, [value]);

    return (
      <textarea
        ref={inner}
        value={value}
        // resize-none: tarik-ubah-ukuran manual menulis `height` eksplisit yang menimpa field-sizing.
        className={cn("field-sizing-content w-full resize-none", className)}
        {...props}
      />
    );
  },
);
