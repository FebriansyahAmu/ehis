import type { Metadata } from "next";
import StatusEnumPage from "@/components/master/status-enum/StatusEnumPage";

export const metadata: Metadata = { title: "Status Enum — Master" };

export default function Page() {
  return <StatusEnumPage />;
}
