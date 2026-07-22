// REST: /api/v1/patients/:id/billing — ringkasan tagihan per KUNJUNGAN untuk satu pasien.
//   GET → BillingKunjunganRowDTO[] (kartu Tagihan di dashboard pasien registrasi).
// Charge = PROYEKSI order + akomodasi + admin (read-only); rincian/pembayaran = modul Billing.
// RBAC registration.kunjungan:read — staf loket boleh lihat ringkasan tagihan pasiennya (bukan
// billing.invoice yang tak dimiliki role Registrasi). Admin superuser bypass.

import { route } from "@/lib/http/route";
import { IdParam } from "@/lib/schemas/patient";
import { billingProjectionService } from "@/lib/services/billing/billingProjectionService";

export const GET = route({
  resource: "registration.kunjungan",
  action: "read",
  params: IdParam,
  handler: ({ params }) => billingProjectionService.listByPatient(params.id),
});
