import type { Metadata } from "next";
import IcdPage from "@/components/master/icd/IcdPage";

export const metadata: Metadata = { title: "ICD-10 & ICD-9-CM — Master" };

export default function Page() {
  return <IcdPage />;
}
