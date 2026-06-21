import { SessionProvider } from "@/contexts/SessionContext";

// Halaman detail Lab = fullpage (di luar shell (main)/ModuleLayout), jadi SessionProvider
// di-mount di sini agar pane bisa pakai useSession (penerima order & analis = user login).
export default function LabDetailLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <div className="flex h-screen flex-col overflow-hidden bg-white">
        {children}
      </div>
    </SessionProvider>
  );
}
