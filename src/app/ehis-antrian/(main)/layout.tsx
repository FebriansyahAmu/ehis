import ModuleLayout from "@/components/layout/ModuleLayout";

export default function EhisAntrianLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ModuleLayout moduleKey="antrian">{children}</ModuleLayout>;
}
