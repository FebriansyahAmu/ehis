import type { Metadata } from "next";
import OperasionalPage from "@/components/master/operasional/OperasionalPage";

export const metadata: Metadata = { title: "Operasional Klinis — Master" };

export default function Page() {
  return <OperasionalPage />;
}
