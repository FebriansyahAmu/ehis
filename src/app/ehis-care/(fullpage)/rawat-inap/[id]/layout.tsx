import { SessionProvider } from "@/contexts/SessionContext";
import { requireCareService } from "@/lib/auth/requireCareService";

// Halaman rekam medis Rawat Inap = fullpage (di luar shell (main)/ModuleLayout), jadi
// SessionProvider di-mount di sini agar komponen klinis bisa pakai useSession (mis. CPPT
// "Ditulis oleh = user login", gate order Resep/BMHP). Halaman klinis = selalu terotentikasi.
export default async function RIPatientFullpageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireCareService("/ehis-care/rawat-inap");
  return (
    <SessionProvider>
      <div className="flex h-screen flex-col overflow-hidden bg-white">
        {children}
      </div>
    </SessionProvider>
  );
}
