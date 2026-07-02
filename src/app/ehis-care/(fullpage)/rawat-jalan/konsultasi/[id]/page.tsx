import type { Metadata } from "next";
import KonsultasiAnswerWorkspace from "@/components/rawat-jalan/konsultasi/KonsultasiAnswerWorkspace";

export const metadata: Metadata = { title: "Jawab Konsultasi" };

export default async function KonsultasiJawabPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <KonsultasiAnswerWorkspace konsultasiId={id} />;
}
