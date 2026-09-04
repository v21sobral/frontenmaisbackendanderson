import { useMemo, useState } from "react";
import PageHeader from "../components/PageHeader";
import { useAudit, type AuditAction, type AuditEntity } from "../context/AuditContext";

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  attendant: "Atendente",
  doctor: "Médico",
  patient: "Paciente",
};

const ACTION_STYLES: Record<AuditAction, { label: string; classes: string }> = {
  CRIOU: { label: "Criou", classes: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  EDITOU: { label: "Editou", classes: "bg-blue-50 text-blue-700 border-blue-100" },
  EXCLUIU: { label: "Excluiu", classes: "bg-rose-50 text-rose-600 border-rose-100" },
  CANCELOU: { label: "Cancelou", classes: "bg-rose-50 text-rose-600 border-rose-100" },
};

function ActionBadge({ action }: { action: AuditAction }) {
  const s = ACTION_STYLES[action];
  return (
    <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border ${s.classes}`}>
      {s.label}
    </span>
  );
}

function formatTimestamp(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AuditPage() {
  const { log } = useAudit();
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState<AuditEntity | "all">("all");
  const [actionFilter, setActionFilter] = useState<AuditAction | "all">("all");

  const entities: AuditEntity[] = ["Paciente", "Médico", "Consulta", "Exame", "Usuário"];
  const actions: AuditAction[] = ["CRIOU", "EDITOU", "EXCLUIU", "CANCELOU"];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return log.filter((entry) => {
      if (entityFilter !== "all" && entry.entity !== entityFilter) return false;
      if (actionFilter !== "all" && entry.action !== actionFilter) return false;
      if (q) {
        const haystack = `${entry.user} ${entry.target} ${entry.detail ?? ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [log, search, entityFilter, actionFilter]);

  return (
    <div className="px-4 py-5 md:px-8 md:py-8">
      <PageHeader
        title="Auditoria"
        subtitle={`${log.length} ${log.length === 1 ? "registro" : "registros"} no sistema \u2014 somente leitura`}
      />

      <div className="flex flex-col md:flex-row gap-2 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por usuário, alvo ou detalhe..."
          className="w-full md:flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
        />
        <select
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value as AuditEntity | "all")}
          className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-emerald-500/30"
        >
          <option value="all">Todas as entidades</option>
          {entities.map((e) => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value as AuditAction | "all")}
          className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-emerald-500/30"
        >
          <option value="all">Todas as ações</option>
          {actions.map((a) => (
            <option key={a} value={a}>{ACTION_STYLES[a].label}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 px-6 py-10 text-center text-sm text-slate-400">
          Nenhum registro encontrado.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="divide-y divide-slate-100">
            {filtered.map((entry) => (
              <div key={entry.id} className="px-5 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-slate-800">{entry.user}</span>
                    <span className="text-xs text-slate-400">({ROLE_LABELS[entry.role] ?? entry.role})</span>
                    <ActionBadge action={entry.action} />
                    <span className="text-xs text-slate-500">{entry.entity}</span>
                  </div>
                  <p className="text-sm text-slate-600 mt-1 truncate">
                    <span className="font-medium text-slate-700">{entry.target}</span>
                    {entry.detail ? <span className="text-slate-400"> — {entry.detail}</span> : null}
                  </p>
                </div>
                <span className="text-xs text-slate-400 whitespace-nowrap">{formatTimestamp(entry.timestamp)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
