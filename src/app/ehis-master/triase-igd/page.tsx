import type { Metadata } from "next";
import TriaseIGDPage from "@/components/master/triase-igd/TriaseIGDPage";

export const metadata: Metadata = { title: "Triase IGD — Master" };

export default function Page() {
  return <TriaseIGDPage />;
}
