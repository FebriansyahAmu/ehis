import type { Metadata } from "next";
import PPKPage from "@/components/master/ppk/PPKPage";

export const metadata: Metadata = { title: "Faskes Rujukan (PPK) — EHIS Master" };

export default function Page() {
  return <PPKPage />;
}
