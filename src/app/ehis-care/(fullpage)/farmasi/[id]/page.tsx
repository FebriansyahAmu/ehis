import type { Metadata } from "next";
import FarmasiOrderDetail from "@/components/farmasi/FarmasiOrderDetail";

export const metadata: Metadata = { title: "Farmasi · Detail Order" };

// Order resep dibaca dari DB (medicalrecord.ResepOrder) di client (auth cookie + ABAC).
export default async function FarmasiOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <FarmasiOrderDetail id={id} />;
}
