import { useData } from "../context/DataContext";
import type { AuthUser } from "../App";

interface Props { user: AuthUser; }

export default function DoctorDashboard({ user }: Props) {
  const { appointments, patients, exams, doctors } = useData();
  const doctorId = user.doctorId ?? null;
  const doctor = doctorId !== null ? doctors.find((d) => d.id === doctorId) : undefined;
  const today = new Date().toISOString().split("T")[0];
  const myAppts = doctorId !== null ? appointments.filter((a) => a.doctorId === doctorId && a.date === today) : [];
  const myExams = doctorId !== null ? exams.filter((e) => e.doctorId === doctorId && e.status === "SOLICITADO") : [];
  const atendidos = doctorId !== null ? appointments.filter((a) => a.doctorId === doctorId && a.status === "REALIZADA").length : 0;

  return (
    <div className="px-4 py-5 md:px-8 md:py-6 space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-slate-800" style={{ fontFamily: "Outfit, sans-serif" }}>Minha Agenda</h1>
        <p className="text-xs text-slate-400 mt-0.5">{doctor ? `${doctor.name} · ${doctor.specialty}` : user.name}</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Hoje", value: myAppts.length, color: "text-emerald-600" },
          { label: "Pendentes", value: myExams.length, color: "text-amber-600" },
          { label: "Atendidos", value: atendidos, color: "text-teal-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-slate-100 rounded-2xl p-3 text-center">
            <p className={`text-xl font-bold ${s.color}`} style={{ fontFamily: "Outfit, sans-serif" }}>{s.value}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-50">
          <h2 className="text-sm font-semibold text-slate-700" style={{ fontFamily: "Outfit, sans-serif" }}>Pacientes de hoje</h2>
        </div>
        {myAppts.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-sm">Sem consultas hoje</div>
        ) : (
          <div className="divide-y divide-slate-50">
            {myAppts.map((appt) => {
              const pat = patients.find((p) => p.id === appt.patientId);
              return (
                <div key={appt.id} className="flex items-center px-4 py-3 gap-3">
                  <div className="w-9 h-9 rounded-full bg-teal-50 flex items-center justify-center text-teal-700 font-semibold text-sm flex-shrink-0">
                    {pat?.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700">{pat?.name}</p>
                    <p className="text-xs text-slate-400 truncate">{appt.reason}</p>
                  </div>
                  <span className="text-xs font-semibold text-emerald-600">{appt.time}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {myExams.length > 0 && (
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-50">
            <h2 className="text-sm font-semibold text-slate-700" style={{ fontFamily: "Outfit, sans-serif" }}>Exames pendentes</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {myExams.map((exam) => {
              const pat = patients.find((p) => p.id === exam.patientId);
              return (
                <div key={exam.id} className="flex items-center px-4 py-3 gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700">{exam.name}</p>
                    <p className="text-xs text-slate-400">{pat?.name} · {exam.type}</p>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100">{exam.status}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
