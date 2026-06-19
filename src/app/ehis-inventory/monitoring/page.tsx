import type { Metadata } from "next";
import Monitoring from "@/components/inventory/Monitoring";

export const metadata: Metadata = { title: "Monitoring — EHIS Inventory" };

export default function Page() {
  return <Monitoring />;
}
