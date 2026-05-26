import ModuleLayout from "@/components/layout/ModuleLayout";

export default function EhisEklaimLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ModuleLayout moduleKey="eklaim">{children}</ModuleLayout>;
}
