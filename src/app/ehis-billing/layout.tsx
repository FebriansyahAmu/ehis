import ModuleLayout from "@/components/layout/ModuleLayout";

export default function EhisBillingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ModuleLayout moduleKey="billing">
      {children}
    </ModuleLayout>
  );
}
