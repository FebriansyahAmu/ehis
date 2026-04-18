import ModuleLayout from "@/components/layout/ModuleLayout";

export default function EhisCareMainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ModuleLayout moduleKey="care">
      {children}
    </ModuleLayout>
  );
}
