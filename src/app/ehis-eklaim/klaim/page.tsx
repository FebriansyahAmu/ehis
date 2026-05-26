import type { Metadata } from "next";
import KlaimBoardPage from "@/components/eklaim/klaim/KlaimBoardPage";

export const metadata: Metadata = { title: "E-Klaim · Klaim Board" };

export default function EhisEklaimKlaimPage() {
  return <KlaimBoardPage />;
}
