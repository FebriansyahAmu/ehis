import type { Metadata } from "next";
import Pengiriman from "@/components/inventory/Pengiriman";

export const metadata: Metadata = { title: "Pengiriman — EHIS Inventory" };

export default function Page() {
  return <Pengiriman />;
}
