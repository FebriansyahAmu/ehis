import { SessionProvider } from "@/contexts/SessionContext";

// Halaman rekam medis IGD = fullpage (di luar shell (main)/ModuleLayout), jadi
// SessionProvider di-mount di sini agar komponen klinis bisa pakai useSession
// (mis. TTVTab "Dicatat oleh = user login"). Halaman klinis = selalu terotentikasi.
export default function IGDPatientFullpageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <div className="flex h-screen flex-col overflow-hidden bg-white">
        {children}
      </div>
    </SessionProvider>
  );
}
