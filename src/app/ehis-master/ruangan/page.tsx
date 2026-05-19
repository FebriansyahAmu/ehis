import type { Metadata } from "next";
import RuanganPage from "@/components/master/ruangan/RuanganPage";

export const metadata: Metadata = { title: "Unit & Ruangan — Master" };

export default function Page() {
  return <RuanganPage />;
}
