import ModuleLayout from "@/components/layout/ModuleLayout";

export default function EhisMasterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ModuleLayout moduleKey="master">
      {children}
    </ModuleLayout>
  );
}
