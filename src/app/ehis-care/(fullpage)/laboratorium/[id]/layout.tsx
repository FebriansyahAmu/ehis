import { SessionProvider } from "@/contexts/SessionContext";
import { requireCareService } from "@/lib/auth/requireCareService";

// Halaman detail Lab = fullpage (di luar shell (main)/ModuleLayout), jadi SessionProvider
// di-mount di sini agar pane bisa pakai useSession (penerima order & analis = user login).
export default async function LabDetailLayout({ children }: { children: React.ReactNode }) {
  await requireCareService("/ehis-care/laboratorium");
  return (
    <SessionProvider>
      <div className="flex h-screen flex-col overflow-hidden bg-white">
        {children}
      </div>
    </SessionProvider>
  );
}
