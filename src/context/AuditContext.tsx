import { createContext, useContext, useState } from "react";

export type AuditAction = "CRIOU" | "EDITOU" | "EXCLUIU" | "CANCELOU";
export type AuditEntity = "Paciente" | "Médico" | "Consulta" | "Exame" | "Usuário";

export interface AuditEntry {
  id: number;
  timestamp: string;
  user: string;
  role: string;
  action: AuditAction;
  entity: AuditEntity;
  target: string;
  detail?: string;
}

interface AuditContextValue {
  log: AuditEntry[];
  record: (user: string, role: string, action: AuditAction, entity: AuditEntity, target: string, detail?: string) => void;
}

const AuditContext = createContext<AuditContextValue | null>(null);

export function AuditProvider({ children }: { children: React.ReactNode }) {
  const [log, setLog] = useState<AuditEntry[]>([]);

  const record = (user: string, role: string, action: AuditAction, entity: AuditEntity, target: string, detail?: string) => {
    setLog((prev) => [
      { id: Date.now(), timestamp: new Date().toISOString(), user, role, action, entity, target, detail },
      ...prev,
    ]);
  };

  return <AuditContext.Provider value={{ log, record }}>{children}</AuditContext.Provider>;
}

export function useAudit() {
  const ctx = useContext(AuditContext);
  if (!ctx) throw new Error("useAudit must be used inside AuditProvider");
  return ctx;
}
