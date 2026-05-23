import type { Metadata } from "next";
import DischargePage from "@/components/master/discharge/DischargePage";

export const metadata: Metadata = { title: "Discharge Klasifikasi — Master" };

export default function Page() {
  return <DischargePage />;
}
