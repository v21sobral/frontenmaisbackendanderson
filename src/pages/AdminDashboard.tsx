import { useAudit, type AuditAction } from "../context/AuditContext";

const ROLE_LABELS: Record<string, string> = { admin: "Administrador", attendant: "Atendente", doctor: "Médico" };

function formatTimestamp(iso: string) {
  const d = new Date(iso);
  return `${d.toLocaleDateString("pt-BR")} ${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
}
import { useData } from "../context/DataContext";

const ACTION_STYLE: Record<AuditAction, string> = {
  CRIOU: "bg-emerald-50 text-emerald-700 border-emerald-100",
  EDITOU: "bg-amber-50 text-amber-700 border-amber-100",
  EXCLUIU: "bg-rose-50 text-rose-600 border-rose-100",
  CANCELOU: "bg-slate-100 text-slate-500 border-slate-200",
};

export default function AdminDashboard() {
  const { log } = useAudit();
  const { patients, doctors, appointments, sysUsers } = useData();
  const today = new Date().toISOString().split("T")[0];
  const todayAppts = appointments.filter((a) => a.date === today);
  const activeUsers = sysUsers.filter((u) => u.active).length;

  const stats = [
    { label: "Pacientes", value: patients.length, icon: "👤", color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Médicos", value: doctors.length, icon: "🩺", color: "text-teal-600", bg: "bg-teal-50" },
    { label: "Hoje", value: todayAppts.length, icon: "📅", color: "text-violet-600", bg: "bg-violet-50" },
    { label: "Usuários", value: activeUsers, icon: "⚙", color: "text-emerald-600", bg: "bg-emerald-50" },
  ];

  return (
    <div className="px-4 py-5 md:px-8 md:py-6 space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-slate-800" style={{ fontFamily: "Outfit, sans-serif" }}>Dashboard</h1>
        <p className="text-xs text-slate-400 mt-0.5">{new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="bg-white border border-slate-100 rounded-2xl p-4">
            <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center text-lg mb-2`}>{s.icon}</div>
            <p className={`text-2xl font-bold ${s.color}`} style={{ fontFamily: "Outfit, sans-serif" }}>{s.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="md:grid md:grid-cols-2 md:gap-5 space-y-5 md:space-y-0">
      {/* Status bars */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4">
        <h2 className="text-sm font-semibold text-slate-700 mb-4" style={{ fontFamily: "Outfit, sans-serif" }}>Consultas por status</h2>
        {(["AGENDADA", "REALIZADA", "CANCELADA"] as const).map((s) => {
          const count = appointments.filter((a) => a.status === s).length;
          const pct = Math.round((count / appointments.length) * 100);
          const colors = { AGENDADA: "bg-blue-400", REALIZADA: "bg-emerald-400", CANCELADA: "bg-rose-400" };
          const textColors = { AGENDADA: "text-blue-700", REALIZADA: "text-emerald-700", CANCELADA: "text-rose-600" };
          return (
            <div key={s} className="mb-3 last:mb-0">
              <div className="flex justify-between items-center mb-1.5">
                <span className={`text-xs font-medium ${textColors[s]}`}>{s}</span>
                <span className="text-xs text-slate-400">{count}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full">
                <div className={`h-2 rounded-full ${colors[s]} transition-all`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Upcoming appointments */}
      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden md:self-start">
        <div className="px-4 py-3 border-b border-slate-50">
          <h2 className="text-sm font-semibold text-slate-700" style={{ fontFamily: "Outfit, sans-serif" }}>Próximas consultas</h2>
        </div>
        <div className="divide-y divide-slate-50">
          {appointments.filter((a) => a.status === "AGENDADA").slice(0, 4).map((appt) => {
            const pat = patients.find((p) => p.id === appt.patientId);
            const doc = doctors.find((d) => d.id === appt.doctorId);
            return (
              <div key={appt.id} className="flex items-center px-4 py-3 gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 font-semibold text-sm flex-shrink-0">
                  {pat?.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{pat?.name}</p>
                  <p className="text-xs text-slate-400 truncate">{doc?.name}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-semibold text-slate-600">{new Date(appt.date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}</p>
                  <p className="text-xs text-slate-400">{appt.time}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      </div>{/* end two-col grid */}

      {/* Audit log */}
      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-50 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700" style={{ fontFamily: "Outfit, sans-serif" }}>Log de alterações</h2>
          {log.length > 0 && (
            <span className="text-[10px] font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{log.length}</span>
          )}
        </div>
        {log.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-slate-400 text-sm">Nenhuma alteração registrada</p>
            <p className="text-slate-300 text-xs mt-1">Ações dos usuários aparecerão aqui</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {log.map((entry) => (
              <div key={entry.id} className="px-4 py-3 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${ACTION_STYLE[entry.action]}`}>
                      {entry.action}
                    </span>
                    <span className="text-xs font-medium text-slate-700 truncate">{entry.target}</span>
                    <span className="text-[10px] text-slate-400">{entry.entity}</span>
                  </div>
                  {entry.detail && (
                    <p className="text-xs text-slate-400 mt-0.5 truncate">{entry.detail}</p>
                  )}
                  <p className="text-[10px] text-slate-300 mt-0.5">
                    por {entry.user}{entry.role ? ` (${ROLE_LABELS[entry.role] ?? entry.role})` : ""}
                  </p>
                </div>
                <p className="text-[10px] text-slate-300 flex-shrink-0 mt-0.5 text-right">
                  {formatTimestamp(entry.timestamp)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
