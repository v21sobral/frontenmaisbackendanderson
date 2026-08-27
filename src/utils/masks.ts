export function maskCPF(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

export function maskPhone(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

// Format: CRM-UF 000000  e.g. CRM-SP 123456, CRM-RJ 4521
// Rules: UF = exactly 2 uppercase letters; number = 1–6 digits (varies by state)
export function maskCRM(value: string): string {
  const upper = value.toUpperCase();

  // Allow progressive typing of the "CRM-" prefix itself
  if (/^(C|CR|CRM|CRM-)$/.test(upper)) return upper;

  // Strip the "CRM-" or "CRM" prefix to get the bare content
  const bare = upper.startsWith("CRM-")
    ? upper.slice(4)
    : upper.startsWith("CRM")
    ? upper.slice(3)
    : upper;

  // UF: only letters, max 2 characters
  const uf = bare.replace(/[^A-Z]/g, "").slice(0, 2);
  // Number: only digits after UF letters (skip any letters already consumed), max 6
  const num = bare.slice(uf.length).replace(/\D/g, "").slice(0, 6);

  if (!uf) return "CRM-";
  if (!num) return `CRM-${uf}`;
  return `CRM-${uf} ${num}`;
}

// Normalization helpers for duplicate checking
export function normalizeCPF(value: string): string {
  return value.replace(/\D/g, "");
}

export function normalizeCRM(value: string): string {
  return value.replace(/[^A-Z0-9]/gi, "").toUpperCase();
}
