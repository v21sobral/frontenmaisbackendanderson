import { createContext, useContext, useEffect, useState } from "react";

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

// Mesmo backend usado pelo DataContext — se não estiver configurado, o log
// de auditoria roda só em memória (sem persistir), igual a antes.
const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "");

export function AuditProvider({ children }: { children: React.ReactNode }) {
  const [log, setLog] = useState<AuditEntry[]>([]);

  // Busca o log já salvo no backend assim que o app abre.
  useEffect(() => {
    if (!API_URL) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/audit`);
        if (!res.ok) throw new Error(`Backend respondeu ${res.status}`);
        const data: AuditEntry[] = await res.json();
        if (!cancelled) setLog(data);
      } catch (err) {
        console.error("Falha ao carregar o log de auditoria:", err);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const record = (user: string, role: string, action: AuditAction, entity: AuditEntity, target: string, detail?: string) => {
    const entry: AuditEntry = { id: Date.now(), timestamp: new Date().toISOString(), user, role, action, entity, target, detail };

    // Atualização otimista: aparece na tela na hora, sem esperar a rede.
    setLog((prev) => [entry, ...prev]);

    if (!API_URL) return;
    fetch(`${API_URL}/api/audit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
      keepalive: true,
    }).catch((err) => {
      console.error("Falha ao salvar registro de auditoria no backend:", err);
    });
  };

  return <AuditContext.Provider value={{ log, record }}>{children}</AuditContext.Provider>;
}

export function useAudit() {
  const ctx = useContext(AuditContext);
  if (!ctx) throw new Error("useAudit must be used inside AuditProvider");
  return ctx;
}
