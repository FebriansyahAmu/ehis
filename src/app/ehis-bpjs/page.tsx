import type { Metadata } from "next";
import BerandaBPJSPage from "@/components/bpjs/beranda/BerandaBPJSPage";

export const metadata: Metadata = { title: "BPJS · Beranda" };

export default function EhisBpjsPage() {
  return <BerandaBPJSPage />;
}
