import type { Metadata } from "next";
import SkalaUmumPage from "@/components/master/skala-umum/SkalaUmumPage";

export const metadata: Metadata = { title: "Skala Umum — Master" };

export default function Page() {
  return <SkalaUmumPage />;
}
