// Guard RBAC modul Registration (membungkus route-group (main) & (fullpage)).
import { requireModule } from "@/lib/auth/requireModule";

export default async function EhisRegistrationGuard({ children }: { children: React.ReactNode }) {
  await requireModule("registration");
  return children;
}
