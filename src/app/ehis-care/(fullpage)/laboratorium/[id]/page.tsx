import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLabOrderById } from "@/components/lab/labShared";
import LabOrderHeader from "@/components/lab/LabOrderHeader";
import LabOrderTabs   from "@/components/lab/LabOrderTabs";

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
): Promise<Metadata> {
  const { id }  = await params;
  const order   = getLabOrderById(id);
  return { title: order ? `Lab · ${order.noOrder}` : "Lab Order" };
}

export default async function LabOrderDetailPage(
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const order  = getLabOrderById(id);
  if (!order) notFound();

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <LabOrderHeader order={order} />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <LabOrderTabs initialOrder={order} />
      </div>
    </div>
  );
}
