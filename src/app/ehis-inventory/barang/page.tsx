import type { Metadata } from "next";
import DaftarBarang from "@/components/inventory/DaftarBarang";

export const metadata: Metadata = { title: "Daftar Barang — EHIS Inventory" };

export default function Page() {
  return <DaftarBarang />;
}
