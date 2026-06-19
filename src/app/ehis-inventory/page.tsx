import type { Metadata } from "next";
import InventoryBeranda from "@/components/inventory/InventoryBeranda";

export const metadata: Metadata = { title: "Beranda — EHIS Inventory" };

export default function Page() {
  return <InventoryBeranda />;
}
