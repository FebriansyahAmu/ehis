import type { ReactNode } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Display antrean" };

export default function DisplayLayout({ children }: { children: ReactNode }) {
  // Layar ruang tunggu — full-screen, TANPA Navbar/Sidebar. Warna & tema (terang/gelap)
  // diatur DisplayScreen lewat token `--d-*` (lihat components/antrean/display/displayTema.ts).
  return <div className="min-h-screen w-full lg:h-screen lg:overflow-hidden">{children}</div>;
}
