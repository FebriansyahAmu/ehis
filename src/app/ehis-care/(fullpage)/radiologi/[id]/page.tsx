import type { Metadata } from "next";
import RadOrderWorkspace from "@/components/rad/RadOrderWorkspace";

export const metadata: Metadata = { title: "Rad · Detail Order" };

// Order rad dibaca dari DB (medicalrecord.RadOrder) di client (auth cookie + ABAC). Desain
// RadOrderHeader + RadOrderTabs dipertahankan; data dipetakan dari DB di RadOrderWorkspace.
export default async function RadOrderDetailPage(
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return <RadOrderWorkspace id={id} />;
}
