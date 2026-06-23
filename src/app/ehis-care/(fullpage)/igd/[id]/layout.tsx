import { SessionProvider } from "@/contexts/SessionContext";
import { requireCareService } from "@/lib/auth/requireCareService";

// Halaman rekam medis IGD = fullpage (di luar shell (main)/ModuleLayout), jadi
// SessionProvider di-mount di sini agar komponen klinis bisa pakai useSession
// (mis. TTVTab "Dicatat oleh = user login"). Halaman klinis = selalu terotentikasi.
export default async function IGDPatientFullpageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireCareService("/ehis-care/igd");
  return (
    <SessionProvider>
      <div className="flex h-screen flex-col overflow-hidden bg-white">
        {children}
      </div>
    </SessionProvider>
  );
}
