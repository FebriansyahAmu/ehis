import { SessionProvider } from "@/contexts/SessionContext";
import { requireCareService } from "@/lib/auth/requireCareService";

// Halaman jawab konsultasi = fullpage (di luar shell (main)/ModuleLayout). SessionProvider
// di-mount agar nama konsultan diambil dari sesi login (useSession, read-only).
export default async function KonsultasiJawabLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireCareService("/ehis-care/rawat-jalan");
  return (
    <SessionProvider>
      <div className="flex h-screen flex-col overflow-hidden bg-slate-50">
        {children}
      </div>
    </SessionProvider>
  );
}
