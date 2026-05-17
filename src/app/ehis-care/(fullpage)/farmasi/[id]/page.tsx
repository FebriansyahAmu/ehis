import { notFound }   from "next/navigation";
import type { Metadata } from "next";
import { getOrderById } from "@/components/farmasi/farmasiShared";
import FarmasiOrderHeader from "@/components/farmasi/FarmasiOrderHeader";
import FarmasiOrderTabs   from "@/components/farmasi/FarmasiOrderTabs";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id }  = await params;
  const order   = getOrderById(id);
  return { title: order ? `Farmasi · ${order.namaPasien}` : "Order Tidak Ditemukan" };
}

export default async function FarmasiOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order  = getOrderById(id);
  if (!order) notFound();

  return (
    <div className="flex h-full flex-col">
      <FarmasiOrderHeader order={order} />
      <FarmasiOrderTabs   orderId={order.id} />
    </div>
  );
}
