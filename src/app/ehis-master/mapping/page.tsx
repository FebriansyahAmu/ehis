import type { Metadata } from "next";
import MappingHubPage from "@/components/master/mapping/MappingHubPage";

export const metadata: Metadata = { title: "Mapping Hub — Master" };

export default function Page() {
  return <MappingHubPage />;
}
