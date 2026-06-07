// Guard RBAC modul Care (membungkus route-group (main) & (fullpage)).
// ModuleLayout/Sidebar tetap di layout (main); ini hanya menegakkan akses modul.
import { requireModule } from "@/lib/auth/requireModule";

export default async function EhisCareGuard({ children }: { children: React.ReactNode }) {
  await requireModule("care");
  return children;
}
