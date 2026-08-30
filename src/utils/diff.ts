export function describeChanges<T extends Record<string, unknown>>(
  before: T,
  after: T,
  labels: Record<string, string>
): string {
  const changes: string[] = [];
  for (const key in labels) {
    const oldVal = before[key];
    const newVal = after[key];
    if (oldVal !== newVal && !(oldVal == null && newVal === "")) {
      changes.push(`${labels[key]}: "${oldVal ?? "—"}" → "${newVal ?? "—"}"`);
    }
  }
  return changes.length ? changes.join("; ") : "Nenhum dado alterado";
}
