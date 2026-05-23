import type { Metadata } from "next";
import TemplateAnamnesisPage from "@/components/master/template-anamnesis/TemplateAnamnesisPage";

export const metadata: Metadata = { title: "Template Anamnesis — Master" };

export default function Page() {
  return <TemplateAnamnesisPage />;
}
