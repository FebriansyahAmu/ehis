import { SidebarProvider } from "@/contexts/SidebarContext";
import { SessionProvider } from "@/contexts/SessionContext";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import { getServerActor } from "@/lib/auth/actor";
import { authService } from "@/lib/services/authService";
import type { SessionDTO } from "@/lib/schemas/auth";
import type { ModuleKey } from "@/lib/navigation";

export default async function ModuleLayout({
  moduleKey,
  children,
}: {
  moduleKey: ModuleKey;
  children: React.ReactNode;
}) {
  // Seed sesi dari server (cookie) → first paint sidebar sudah ter-filter per izin (anti-flicker).
  // Gagal resolve (belum login / AUTH_ENFORCE=false dev) → null, jatuh ke fetch klien.
  let initialSession: SessionDTO | null = null;
  try {
    const actor = await getServerActor();
    initialSession = await authService.getSession(actor.userId);
  } catch {
    initialSession = null;
  }

  return (
    <SessionProvider initialSession={initialSession}>
      <SidebarProvider>
        <div className="flex h-full min-h-screen flex-col">
          <Navbar activeModule={moduleKey} />
          <div className="flex flex-1 overflow-hidden">
            <Sidebar moduleKey={moduleKey} />
            <main
              id="main-content"
              className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950"
            >
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </SessionProvider>
  );
}
