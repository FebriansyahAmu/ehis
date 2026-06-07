import ModuleLayout from "@/components/layout/ModuleLayout";
import BPJSToastContainer from "@/components/bpjs/shared/BPJSToast";
import { requireModule } from "@/lib/auth/requireModule";

export default async function EhisBpjsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireModule("bpjs");
  return (
    <ModuleLayout moduleKey="bpjs">
      {children}
      <BPJSToastContainer />
    </ModuleLayout>
  );
}
