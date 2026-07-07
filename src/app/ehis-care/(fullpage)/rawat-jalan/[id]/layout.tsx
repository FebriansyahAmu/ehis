import { SessionProvider } from "@/contexts/SessionContext";
import { requireCareService } from "@/lib/auth/requireCareService";

// Halaman rekam medis Rawat Jalan = fullpage (di luar shell (main)/ModuleLayout), jadi
// SessionProvider di-mount di sini agar komponen klinis bisa pakai useSession (mis. Anamnesis
// "Dicatat oleh = user login", CPPT, gate order). Halaman klinis = selalu terotentikasi.
export default async function RJPatientFullpageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireCareService("/ehis-care/rawat-jalan");
  return (
    <SessionProvider>
      <div className="flex h-screen flex-col overflow-hidden bg-white">
        {children}
      </div>
    </SessionProvider>
  );
}
