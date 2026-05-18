import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getRadOrderById } from "@/components/rad/radShared";
import RadOrderHeader from "@/components/rad/RadOrderHeader";
import RadOrderTabs   from "@/components/rad/RadOrderTabs";

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
): Promise<Metadata> {
  const { id }  = await params;
  const order   = getRadOrderById(id);
  return { title: order ? `Rad · ${order.noOrder}` : "Rad Order" };
}

export default async function RadOrderDetailPage(
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const order  = getRadOrderById(id);
  if (!order) notFound();

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <RadOrderHeader order={order} />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <RadOrderTabs initialOrder={order} />
      </div>
    </div>
  );
}
