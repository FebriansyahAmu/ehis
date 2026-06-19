import type { Metadata } from "next";
import Rekanan from "@/components/inventory/Rekanan";

export const metadata: Metadata = { title: "Rekanan — EHIS Inventory" };

export default function Page() {
  return <Rekanan />;
}
