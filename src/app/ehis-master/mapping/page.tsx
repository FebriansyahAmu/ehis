import type { Metadata } from "next";
import { Suspense } from "react";
import MappingHubPage from "@/components/master/mapping/MappingHubPage";

export const metadata: Metadata = { title: "Mapping Hub — Master" };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <MappingHubPage />
    </Suspense>
  );
}
