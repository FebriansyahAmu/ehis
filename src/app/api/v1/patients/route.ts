// REST: /api/v1/patients — koleksi pasien (FLOWS §16).
//   GET  ?q=&by=nik|rm|nama&cursor=&limit=  → cari/list (cursor pagination)
//   POST                                    → daftar pasien (dedup-first)
// Route TIPIS: route() menangani auth→RBAC→Zod→envelope→error.

import { route, paginated, reply } from "@/lib/http/route";
import { SearchQuery, RegisterPatientInput } from "@/lib/schemas/patient";
import { patientService } from "@/lib/services/patientService";

export const GET = route({
  resource: "registration.patient",
  action: "read",
  query: SearchQuery,
  handler: async ({ query }) => {
    const { items, cursor } = await patientService.searchPatient(query);
    return paginated(items, { cursor });
  },
});

export const POST = route({
  resource: "registration.patient",
  action: "create",
  body: RegisterPatientInput,
  handler: async ({ body, actor }) => {
    const { patient, created } = await patientService.registerPatient(body, actor);
    // 201 saat benar-benar baru; 200 saat dedup (pasien sudah ada).
    return reply(patient, {
      status: created ? 201 : 200,
      message: created
        ? `Pasien ${patient.nama} berhasil didaftarkan`
        : `Pasien ${patient.nama} sudah terdaftar — data dimuat`,
    });
  },
});
