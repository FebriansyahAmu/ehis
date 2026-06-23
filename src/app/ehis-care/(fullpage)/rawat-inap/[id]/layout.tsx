import { requireCareService } from "@/lib/auth/requireCareService";

export default async function RIPatientFullpageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireCareService("/ehis-care/rawat-inap");
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white">
      {children}
    </div>
  );
}
