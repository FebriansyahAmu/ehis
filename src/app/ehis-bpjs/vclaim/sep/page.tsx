import SEPPage from "@/components/bpjs/sep/SEPPage";
import { requireBpjsMenu } from "@/lib/auth/requireBpjsMenu";

export const metadata = { title: "SEP — V-Claim BPJS | EHIS" };

export default async function SEPRoute() {
  await requireBpjsMenu("/ehis-bpjs/vclaim/sep");
  return <SEPPage />;
}
