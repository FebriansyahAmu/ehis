import type { Metadata } from "next";
import Distribusi from "@/components/inventory/Distribusi";

export const metadata: Metadata = { title: "Distribusi — EHIS Inventory" };

export default function Page() {
  return <Distribusi />;
}
