import { headers } from "next/headers";
import { SidebarProvider } from "@/app/contexts/SidebarContext";
import Navbar from "@/app/components/Navbar";
import Sidebar from "@/app/components/Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "/dashboard";

  return (
    <SidebarProvider>
      <div className="flex h-full min-h-screen flex-col">
        <Navbar />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar pathname={pathname} />
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
