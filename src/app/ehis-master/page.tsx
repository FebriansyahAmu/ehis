import type { Metadata } from "next";
import BerandaMasterPage from "@/components/master/beranda/BerandaMasterPage";

export const metadata: Metadata = { title: "Beranda — EHIS Master" };

export default function Page() {
  return <BerandaMasterPage />;
}
