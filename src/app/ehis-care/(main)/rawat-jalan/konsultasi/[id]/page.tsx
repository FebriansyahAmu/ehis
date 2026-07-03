import type { Metadata } from "next";
import KonsultasiAnswerWorkspace from "@/components/rawat-jalan/konsultasi/KonsultasiAnswerWorkspace";
import { requireCareService } from "@/lib/auth/requireCareService";

// Halaman jawab konsultasi (sisi KONSULTAN) — di DALAM shell modul (Navbar + Sidebar,
// pola konsisten ehis-care) dengan konten full-width. SessionProvider dari ModuleLayout.

export const metadata: Metadata = { title: "Jawab Konsultasi" };

export default async function KonsultasiJawabPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireCareService("/ehis-care/rawat-jalan");
  const { id } = await params;
  return <KonsultasiAnswerWorkspace konsultasiId={id} />;
}
