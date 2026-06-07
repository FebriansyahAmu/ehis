// Guard RBAC modul Antrean (membungkus route-group (main) & (fullpage)).
import { requireModule } from "@/lib/auth/requireModule";

export default async function EhisAntrianGuard({ children }: { children: React.ReactNode }) {
  await requireModule("antrian");
  return children;
}
