/**
 * BPJS Toast Store (BP8.3).
 *
 * Lightweight client-side store untuk global error/success notification
 * adapter BPJS. Max 3 toast stacked — oldest dipotong.
 * Pattern: `useSyncExternalStore` ready.
 */

export type BPJSToastType = "success" | "error" | "warning" | "info";

export interface BPJSToastItem {
  id: string;
  type: BPJSToastType;
  title: string;
  message?: string;
  durationMs?: number;
}

type Listener = () => void;

let toasts: BPJSToastItem[] = [];
const listeners = new Set<Listener>();
let _seq = 1;

function notify(): void {
  listeners.forEach((l) => l());
}

export function getToasts(): BPJSToastItem[] {
  return toasts;
}

export function subscribeToasts(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function pushToast(item: Omit<BPJSToastItem, "id">): string {
  const id = `bpjs-toast-${_seq++}`;
  toasts = [...toasts, { ...item, id }].slice(-3); // keep newest 3
  notify();
  const duration = item.durationMs ?? 4000;
  setTimeout(() => dismissToast(id), duration);
  return id;
}

export function dismissToast(id: string): void {
  toasts = toasts.filter((t) => t.id !== id);
  notify();
}

/** Convenience helpers */
export const bpjsToast = {
  success: (title: string, message?: string) =>
    pushToast({ type: "success", title, message }),
  error: (title: string, message?: string) =>
    pushToast({ type: "error", title, message, durationMs: 6000 }),
  warning: (title: string, message?: string) =>
    pushToast({ type: "warning", title, message }),
  info: (title: string, message?: string) =>
    pushToast({ type: "info", title, message }),
};
