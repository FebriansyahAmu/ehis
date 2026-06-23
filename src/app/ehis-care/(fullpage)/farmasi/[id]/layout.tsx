import { SessionProvider } from "@/contexts/SessionContext";
import { requireCareService } from "@/lib/auth/requireCareService";

// Halaman detail Farmasi = fullpage (di luar shell (main)/ModuleLayout), jadi SessionProvider
// di-mount di sini agar komponen bisa pakai useSession (mis. telaah akhir/penyerahan = user login).
export default async function FarmasiDetailLayout({ children }: { children: React.ReactNode }) {
  await requireCareService("/ehis-care/farmasi");
  return (
    <SessionProvider>
      <div className="flex h-screen flex-col overflow-hidden bg-white">
        {children}
      </div>
    </SessionProvider>
  );
}
