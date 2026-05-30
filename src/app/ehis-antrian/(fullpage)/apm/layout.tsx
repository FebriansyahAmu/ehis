import type { Metadata } from "next";

export const metadata: Metadata = { title: "Anjungan Pendaftaran Mandiri" };

export default function ApmKioskLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Layar kiosk — full-screen, TANPA Navbar/Sidebar.
  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-100">
      {children}
    </div>
  );
}
