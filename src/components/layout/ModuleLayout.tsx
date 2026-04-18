import { SidebarProvider } from "@/contexts/SidebarContext";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import type { ModuleKey } from "@/lib/navigation";

export default function ModuleLayout({
  moduleKey,
  children,
}: {
  moduleKey: ModuleKey;
  children: React.ReactNode;
}) {
  return (
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
  );
}
