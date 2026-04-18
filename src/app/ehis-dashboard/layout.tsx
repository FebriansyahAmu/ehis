import ModuleLayout from "@/components/layout/ModuleLayout";

export default function EhisDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ModuleLayout moduleKey="dashboard">
      {children}
    </ModuleLayout>
  );
}
