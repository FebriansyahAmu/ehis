import type { Metadata } from "next";
import StokOpname from "@/components/inventory/StokOpname";

export const metadata: Metadata = { title: "Stok Opname — EHIS Inventory" };

export default function Page() {
  return <StokOpname />;
}
