import ModuleLayout from "@/components/layout/ModuleLayout";
import BPJSToastContainer from "@/components/bpjs/shared/BPJSToast";

export default function EhisBpjsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ModuleLayout moduleKey="bpjs">
      {children}
      <BPJSToastContainer />
    </ModuleLayout>
  );
}
