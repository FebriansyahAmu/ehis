"use client";

// ANT-ONSITE — Context on-screen keyboard kiosk.
// Field (KioskInput) mendaftarkan diri; keyboard menargetkan field aktif.
// API (register/unregister/focus/close) stabil (useCallback []) agar effect
// di KioskInput tidak churn saat activeId berubah.

import { createContext, useCallback, useContext, useRef, useState } from "react";

export type KbLayout = "text" | "numeric";

export interface KbReg {
  id: string;
  layout: KbLayout;
  maxLength?: number;
  getValue: () => string;
  setValue: (v: string) => void;
}

interface KbContextValue {
  activeId: string | null;
  active: KbReg | null;
  register: (reg: KbReg) => void;
  unregister: (id: string) => void;
  focus: (id: string) => void;
  close: () => void;
}

const KbContext = createContext<KbContextValue | null>(null);

export function useKioskKeyboard(): KbContextValue {
  const ctx = useContext(KbContext);
  if (!ctx) throw new Error("useKioskKeyboard harus dipakai di dalam ApmKeyboardProvider");
  return ctx;
}

export function ApmKeyboardProvider({ children }: { children: React.ReactNode }) {
  const registry = useRef(new Map<string, KbReg>());
  // `active` disimpan di state (di-set dari handler focus) — hindari baca ref saat render.
  const [active, setActive] = useState<KbReg | null>(null);

  const register = useCallback((reg: KbReg) => {
    registry.current.set(reg.id, reg);
  }, []);

  const unregister = useCallback((id: string) => {
    registry.current.delete(id);
    setActive((cur) => (cur?.id === id ? null : cur));
  }, []);

  const focus = useCallback((id: string) => {
    setActive(registry.current.get(id) ?? null);
  }, []);
  const close = useCallback(() => setActive(null), []);

  return (
    <KbContext.Provider value={{ activeId: active?.id ?? null, active, register, unregister, focus, close }}>
      {children}
    </KbContext.Provider>
  );
}
