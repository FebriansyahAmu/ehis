import type { Metadata } from "next";
import SkalaRisikoPage from "@/components/master/skala-risiko/SkalaRisikoPage";

export const metadata: Metadata = { title: "Skala Risiko — Master" };

export default function Page() {
  return <SkalaRisikoPage />;
}
