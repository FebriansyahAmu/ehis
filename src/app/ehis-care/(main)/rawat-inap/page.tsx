import type { Metadata } from "next";

import { RawatInapPageView } from "@/components/rawat-inap/RawatInapPageView";
import { requireCareService } from "@/lib/auth/requireCareService";

export const metadata: Metadata = { title: "Rawat Inap" };

export default async function RawatInapPage() {
  await requireCareService("/ehis-care/rawat-inap");
  // Landing DB-driven (census + informasi tempat tidur). Tanpa data mock.
  return <RawatInapPageView />;
}
