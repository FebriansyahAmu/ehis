import ModuleLayout from "@/components/layout/ModuleLayout";

export default function EhisRegistrationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ModuleLayout moduleKey="registration">
      {children}
    </ModuleLayout>
  );
}
