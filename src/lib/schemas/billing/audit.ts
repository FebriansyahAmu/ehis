// DTO Audit Trail invoice (Slice 2g). Bentuk SELARAS AuditEvent UI (lib/billing/auditTrail) agar
// timeline dirender tanpa remap berat. `action` = AuditActionKind (string; FE cast ke union).
// meta JSONB → diff/target diekspos di DTO. Read-only (gate billing.invoice:read).

export interface AuditDiffDTO {
  field: string;
  before: string | number | null;
  after: string | number | null;
  isMoney?: boolean;
}

export interface AuditTargetDTO {
  type: "item" | "payment" | "invoice" | "klaim";
  id?: string;
  label?: string;
}

export interface AuditEventDTO {
  id: string;
  at: string;              // ISO createdAt
  invoiceId: string;
  action: string;          // AuditActionKind
  actor: { name: string; role: string };
  summary: string;
  amount?: number;
  reason?: string;
  noKwitansi?: string;
  target?: AuditTargetDTO;
  diff?: AuditDiffDTO[];
}
