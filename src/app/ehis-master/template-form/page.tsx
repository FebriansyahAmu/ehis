import type { Metadata } from "next";
import TemplateFormPage from "@/components/master/template-form/TemplateFormPage";

export const metadata: Metadata = { title: "Template Form — Master" };

export default function Page() {
  return <TemplateFormPage />;
}
