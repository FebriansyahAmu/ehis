// Toast store global EHIS (top-right). Pola useSyncExternalStore — konsisten dgn
// bpjsToastStore. Dipakai lintas modul: `toast.success(title, message)`.
// Aman: hanya tampung string (React auto-escape); auto-dismiss + cleanup timer.

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  durationMs?: number;
}

type Listener = () => void;

let toasts: ToastItem[] = [];
const listeners = new Set<Listener>();
const timers = new Map<string, ReturnType<typeof setTimeout>>();
let seq = 1;

function notify(): void {
  listeners.forEach((l) => l());
}

export function getToasts(): ToastItem[] {
  return toasts;
}

export function subscribeToasts(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function dismissToast(id: string): void {
  const t = timers.get(id);
  if (t) {
    clearTimeout(t);
    timers.delete(id);
  }
  toasts = toasts.filter((x) => x.id !== id);
  notify();
}

export function pushToast(item: Omit<ToastItem, "id">): string {
  const id = `toast-${seq++}`;
  toasts = [...toasts, { ...item, id }].slice(-4); // simpan 4 terbaru
  notify();
  const duration = item.durationMs ?? 4000;
  timers.set(id, setTimeout(() => dismissToast(id), duration));
  return id;
}

export const toast = {
  success: (title: string, message?: string) => pushToast({ type: "success", title, message }),
  error: (title: string, message?: string) => pushToast({ type: "error", title, message, durationMs: 6000 }),
  warning: (title: string, message?: string) => pushToast({ type: "warning", title, message }),
  info: (title: string, message?: string) => pushToast({ type: "info", title, message }),
};
