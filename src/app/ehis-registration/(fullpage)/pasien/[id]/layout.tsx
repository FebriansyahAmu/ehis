import { SessionProvider } from "@/contexts/SessionContext";

// Halaman detail pasien = fullpage (di luar shell (main)/ModuleLayout), jadi SessionProvider
// di-mount di sini agar komponen yang butuh sesi bisa pakai useSession (mis. Pendaftaran
// Kunjungan Baru → operator SEP = user login). Guard modul registrasi ada di layout induk.
export default function PatientDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <div className="flex h-screen flex-col overflow-hidden bg-white">
        {children}
      </div>
    </SessionProvider>
  );
}
