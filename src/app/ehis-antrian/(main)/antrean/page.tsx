import type { Metadata } from "next";
import { AntreanListPage } from "@/components/antrean/board/AntreanListPage";

export const metadata: Metadata = { title: "Antrean List — Antrean" };

export default function Page() {
  return <AntreanListPage />;
}
