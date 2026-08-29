import type { Page } from "../App";
import { useData } from "../context/DataContext";

interface Props { onNavigate: (p: Page) => void; }

export default function AttendantDashboard({ onNavigate }: Props) {
  const { appointments, patients, doctors } = useData();
  const today = new Date().toISOString().split("T")[0];
  const todayAppts = appointments.filter((a) => a.date === today);

  return (
    <div className="px-4 py-5 md:px-8 md:py-6 space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-slate-800" style={{ fontFamily: "Outfit, sans-serif" }}>Agenda do dia</h1>
        <p className="text-xs text-slate-400 mt-0.5">{new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Hoje", value: todayAppts.length, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Agendadas", value: todayAppts.filter((a) => a.status === "AGENDADA").length, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Pacientes", value: patients.length, color: "text-teal-600", bg: "bg-teal-50" },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-slate-100 rounded-2xl p-3 text-center">
            <p className={`text-xl font-bold ${s.color}`} style={{ fontFamily: "Outfit, sans-serif" }}>{s.value}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onNavigate("appointments")}
          className="bg-emerald-600 active:bg-emerald-700 text-white text-sm font-semibold py-3.5 rounded-2xl transition-colors"
        >
          + Agendar
        </button>
        <button
          onClick={() => onNavigate("patients")}
          className="bg-white border border-slate-200 text-slate-700 text-sm font-semibold py-3.5 rounded-2xl hover:bg-slate-50 active:bg-slate-100 transition-colors"
        >
          + Paciente
        </button>
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-50">
          <h2 className="text-sm font-semibold text-slate-700" style={{ fontFamily: "Outfit, sans-serif" }}>Consultas de hoje</h2>
        </div>
        {todayAppts.length === 0 ? (
          <div className="py-10 text-center text-slate-400 text-sm">Nenhuma consulta para hoje</div>
        ) : (
          <div className="divide-y divide-slate-50">
            {todayAppts.map((appt) => {
              const pat = patients.find((p) => p.id === appt.patientId);
              const doc = doctors.find((d) => d.id === appt.doctorId);
              return (
                <div key={appt.id} className="flex items-center px-4 py-3 gap-3">
                  <span className="text-sm font-bold text-emerald-600 w-10 flex-shrink-0">{appt.time}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{pat?.name}</p>
                    <p className="text-xs text-slate-400 truncate">{doc?.name} · {appt.reason}</p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${appt.status === "AGENDADA" ? "bg-blue-50 text-blue-700" : appt.status === "REALIZADA" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-600"}`}>
                    {appt.status}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
