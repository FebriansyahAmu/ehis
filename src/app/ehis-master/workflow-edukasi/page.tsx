import type { Metadata } from "next";
import WorkflowEdukasiPage from "@/components/master/workflow-edukasi/WorkflowEdukasiPage";

export const metadata: Metadata = { title: "Workflow Edukasi — Master" };

export default function Page() {
  return <WorkflowEdukasiPage />;
}
