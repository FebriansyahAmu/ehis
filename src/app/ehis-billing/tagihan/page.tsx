import type { Metadata } from "next";
import TagihanBoardPage from "@/components/billing/tagihan/TagihanBoardPage";

export const metadata: Metadata = { title: "Tagihan · EHIS Billing" };

export default function Page() {
  return <TagihanBoardPage />;
}
