import type { Metadata } from "next";
import LabOrderDetail from "@/components/lab/LabOrderDetail";

export const metadata: Metadata = { title: "Lab · Detail Order" };

// Order lab dibaca dari DB (medicalrecord.LabOrder) di client (auth cookie + ABAC).
export default async function LabOrderDetailPage(
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return <LabOrderDetail id={id} />;
}
