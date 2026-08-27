import { useState } from "react";
import Badge from "../components/Badge";
import { useData } from "../context/DataContext";
import type { AuthUser } from "../App";

const PATIENT_EMAIL_MAP: Record<string, number> = { "paciente@vidamaissaude.com": 1 };

interface Props { user: AuthUser; }

export default function PatientDashboard({ user }: Props) {
  const { appointments, exams, doctors, patients } = useData();
  const [showData, setShowData] = useState(false);
  const patientId = PATIENT_EMAIL_MAP[user.email] ?? 1;
  const patient = patients.find((p) => p.id === patientId);

  const myAppts = appointments.filter((a) => a.patientId === patientId);
  const myExams = exams.filter((e) => e.patientId === patientId);
  const today = new Date().toISOString().split("T")[0];
  const next = myAppts.find((a) => a.date >= today && a.status === "AGENDADA");

  const firstName = patient?.name.split(" ")[0] ?? user.name.split(" ")[0];

  return (
    <div className="px-4 py-5 md:px-8 md:py-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-800" style={{ fontFamily: "Outfit, sans-serif" }}>Olá, {firstName}</h1>
          <p className="text-xs text-slate-400 mt-0.5">Suas consultas e exames</p>
        </div>
        <button
          onClick={() => setShowData((v) => !v)}
          className="text-xs font-semibold text-emerald-600 bg-emerald-50 active:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-100"
        >
          Meus Dados
        </button>
      </div>

      {/* Personal data card */}
      {showData && patient && (
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-50 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700" style={{ fontFamily: "Outfit, sans-serif" }}>Meus Dados</h2>
            <button onClick={() => setShowData(false)} className="text-slate-300 hover:text-slate-500 text-lg leading-none">×</button>
          </div>
          <div className="px-4 py-3 space-y-2.5">
            {[
              ["Nome", patient.name],
              ["CPF", patient.cpf],
              ["Data de nascimento", new Date(patient.dob + "T12:00:00").toLocaleDateString("pt-BR")],
              ["Telefone", patient.phone || "—"],
              ["E-mail", patient.email || "—"],
              ["Endereço", patient.address || "—"],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between py-1 border-b border-slate-50 last:border-0">
                <span className="text-xs text-slate-400">{label}</span>
                <span className="text-xs font-medium text-slate-700 text-right max-w-[58%]">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next appointment hero */}
      {next && (() => {
        const doc = doctors.find((d) => d.id === next.doctorId);
        return (
          <div className="bg-emerald-600 rounded-2xl p-4 text-white">
            <p className="text-xs text-emerald-200 font-medium mb-1">Próxima consulta</p>
            <p className="text-base font-semibold">{doc?.name}</p>
            <p className="text-sm text-emerald-200">{doc?.specialty}</p>
            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/20">
              <div>
                <p className="text-[10px] text-emerald-300">DATA</p>
                <p className="text-sm font-semibold">{new Date(next.date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}</p>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div>
                <p className="text-[10px] text-emerald-300">HORÁRIO</p>
                <p className="text-sm font-semibold">{next.time}</p>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div className="flex-1">
                <p className="text-[10px] text-emerald-300">MOTIVO</p>
                <p className="text-xs truncate">{next.reason}</p>
              </div>
            </div>
          </div>
        );
      })()}

      <div className="md:grid md:grid-cols-2 md:gap-5 space-y-4 md:space-y-0">
      {/* Appointment history */}
      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden md:self-start">
        <div className="px-4 py-3 border-b border-slate-50">
          <h2 className="text-sm font-semibold text-slate-700" style={{ fontFamily: "Outfit, sans-serif" }}>Histórico de Consultas</h2>
        </div>
        {myAppts.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-sm">Nenhuma consulta</div>
        ) : (
          <div className="divide-y divide-slate-50">
            {myAppts.map((appt) => {
              const doc = doctors.find((d) => d.id === appt.doctorId);
              return (
                <div key={appt.id} className="flex items-center px-4 py-3 gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0 text-base">🩺</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{doc?.name}</p>
                    <p className="text-xs text-slate-400">{new Date(appt.date + "T12:00:00").toLocaleDateString("pt-BR")} · {appt.time}</p>
                    {appt.notes && <p className="text-xs text-slate-400 italic truncate mt-0.5">"{appt.notes}"</p>}
                  </div>
                  <Badge status={appt.status} />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Exams */}
      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden md:self-start">
        <div className="px-4 py-3 border-b border-slate-50">
          <h2 className="text-sm font-semibold text-slate-700" style={{ fontFamily: "Outfit, sans-serif" }}>Meus Exames</h2>
        </div>
        {myExams.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-sm">Nenhum exame</div>
        ) : (
          <div className="divide-y divide-slate-50">
            {myExams.map((exam) => (
              <div key={exam.id} className="px-4 py-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-slate-700">{exam.name}</p>
                  <Badge status={exam.status as any} />
                </div>
                <p className="text-xs text-slate-400">{exam.type} · {new Date(exam.requestDate + "T12:00:00").toLocaleDateString("pt-BR")}</p>
                {exam.result && (
                  <p className="text-xs text-emerald-600 mt-1.5 font-medium bg-emerald-50 px-2 py-1 rounded-lg">✓ {exam.result}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      </div>{/* end two-col grid */}
    </div>
  );
}
