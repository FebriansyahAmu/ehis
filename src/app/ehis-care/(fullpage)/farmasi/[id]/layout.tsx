import { SessionProvider } from "@/contexts/SessionContext";

// Halaman detail Farmasi = fullpage (di luar shell (main)/ModuleLayout), jadi SessionProvider
// di-mount di sini agar komponen bisa pakai useSession (mis. telaah akhir/penyerahan = user login).
export default function FarmasiDetailLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <div className="flex h-screen flex-col overflow-hidden bg-white">
        {children}
      </div>
    </SessionProvider>
  );
}
