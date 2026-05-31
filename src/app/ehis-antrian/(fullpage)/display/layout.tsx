import type { Metadata } from "next";

export const metadata: Metadata = { title: "Display Antrean — RS Sakti Husada" };

export default function DisplayLayout({ children }: { children: React.ReactNode }) {
  // Layar ruang tunggu — full-screen, TANPA Navbar/Sidebar.
  return <div className="h-screen w-screen overflow-hidden bg-slate-100">{children}</div>;
}
