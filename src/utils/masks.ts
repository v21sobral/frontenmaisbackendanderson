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
// Extrai letras e números de qualquer lugar do texto digitado, então remonta o
// prefixo "CRM-" sempre por conta própria — assim funciona não importa a ordem
// em que a pessoa digite (números antes das letras, ou vice-versa).
export function maskCRM(value: string): string {
  const upper = value.toUpperCase();
  const cleaned = upper.replace(/CRM|-/g, "");
  const uf = cleaned.replace(/[^A-Z]/g, "").slice(0, 2);
  const num = cleaned.replace(/[^0-9]/g, "").slice(0, 6);
  if (!uf && !num) return "";
  if (!uf) return `CRM-${num}`;
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
