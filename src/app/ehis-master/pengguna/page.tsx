import type { Metadata } from "next";
import PenggunaPage from "@/components/master/pengguna/PenggunaPage";

export const metadata: Metadata = { title: "Pengguna Sistem — Master" };

export default function Page() {
  return <PenggunaPage />;
}
