import { requireCareService } from "@/lib/auth/requireCareService";

export default async function RJPatientFullpageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireCareService("/ehis-care/rawat-jalan");
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white">
      {children}
    </div>
  );
}
