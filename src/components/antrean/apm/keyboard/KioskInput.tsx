"use client";

// ANT-ONSITE — Input kiosk: tampil + daftar ke on-screen keyboard.
// Tetap editable (physical keyboard jalan saat dev). Di tablet produksi,
// set `readOnly` untuk menekan OS keyboard — on-screen keyboard tetap berfungsi.

import { useEffect, useId, useRef } from "react";
import { kioskInputClass } from "../apmUi";
import { useKioskKeyboard, type KbLayout } from "./ApmKeyboardProvider";

export function KioskInput({
  value,
  onChange,
  layout = "text",
  maxLength,
  placeholder,
  inputMode,
  autoFocus,
  leftIcon,
  readOnly,
}: {
  value: string;
  onChange: (v: string) => void;
  layout?: KbLayout;
  maxLength?: number;
  placeholder?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  autoFocus?: boolean;
  leftIcon?: React.ReactNode;
  readOnly?: boolean;
}) {
  const { register, unregister, focus } = useKioskKeyboard();
  const id = useId();

  // Ref agar getValue/setValue selalu baca nilai & handler terkini tanpa re-register.
  // Sinkron di effect (bukan saat render) sesuai aturan react-hooks/refs.
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    valueRef.current = value;
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    register({
      id,
      layout,
      maxLength,
      getValue: () => valueRef.current,
      setValue: (v) => onChangeRef.current(v),
    });
    return () => unregister(id);
  }, [id, layout, maxLength, register, unregister]);

  const clamp = (v: string) => (maxLength ? v.slice(0, maxLength) : v);

  return (
    <div className="relative">
      {leftIcon && (
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">
          {leftIcon}
        </span>
      )}
      <input
        value={value}
        onChange={(e) => onChange(clamp(e.target.value))}
        onFocus={() => focus(id)}
        placeholder={placeholder}
        inputMode={inputMode}
        maxLength={maxLength}
        autoFocus={autoFocus}
        readOnly={readOnly}
        className={kioskInputClass}
        style={leftIcon ? { paddingLeft: "3.25rem" } : undefined}
      />
    </div>
  );
}
