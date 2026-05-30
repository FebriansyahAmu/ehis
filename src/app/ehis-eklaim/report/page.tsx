import DashboardPage from "@/components/eklaim/reports/DashboardPage";
import type { ReportTab } from "@/lib/eklaim/dashboardShared";

export const metadata = {
  title: "Dashboard Analitik · E-Klaim EHIS",
};

const VALID_TABS: ReportTab[] = ["approval", "aging", "margin", "coder", "comparator"];

export default async function EklaimReportPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const initialTab = VALID_TABS.includes(tab as ReportTab) ? (tab as ReportTab) : "approval";
  return <DashboardPage initialTab={initialTab} />;
}
