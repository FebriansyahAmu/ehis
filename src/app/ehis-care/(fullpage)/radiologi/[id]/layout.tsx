import { SessionProvider } from "@/contexts/SessionContext";

// Halaman detail Radiologi = fullpage (di luar shell (main)/ModuleLayout), jadi SessionProvider
// di-mount di sini agar pane bisa pakai useSession (Verifikasi Identitas: "Diterima Oleh" = user
// login + SDM Assignment guard, selaras Penerimaan Lab). Selaras layout detail Lab.
export default function RadDetailLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <div className="flex h-screen flex-col overflow-hidden bg-white">
        {children}
      </div>
    </SessionProvider>
  );
}
