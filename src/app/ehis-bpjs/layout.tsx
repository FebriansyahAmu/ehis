import ModuleLayout from "@/components/layout/ModuleLayout";

export default function EhisBpjsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ModuleLayout moduleKey="bpjs">{children}</ModuleLayout>;
}
