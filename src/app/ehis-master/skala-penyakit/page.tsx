import type { Metadata } from "next";
import SkalaPenyakitPage from "@/components/master/skala-penyakit/SkalaPenyakitPage";

export const metadata: Metadata = { title: "Skala Penyakit — Master" };

export default function Page() {
  return <SkalaPenyakitPage />;
}
