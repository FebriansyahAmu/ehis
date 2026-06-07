import ModuleLayout from "@/components/layout/ModuleLayout";
import { requireModule } from "@/lib/auth/requireModule";

export default async function EhisMasterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireModule("master");
  return (
    <ModuleLayout moduleKey="master">
      {children}
    </ModuleLayout>
  );
}
