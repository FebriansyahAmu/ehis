import type { Metadata } from "next";
import KlaimDetailPage from "@/components/eklaim/detail/KlaimDetailPage";

interface RouteParams {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ tab?: string }>;
}

export const metadata: Metadata = { title: "E-Klaim · Detail Klaim" };

export default async function Page({ params, searchParams }: RouteParams) {
  const { id } = await params;
  const sp = searchParams ? await searchParams : undefined;
  return <KlaimDetailPage id={id} initialTab={sp?.tab} />;
}
