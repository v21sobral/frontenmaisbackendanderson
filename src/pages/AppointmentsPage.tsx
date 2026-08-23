import { useState } from "react";
import { type Appointment } from "../data/mock";
import Modal from "../components/Modal";
import Badge from "../components/Badge";
import type { AuthUser } from "../App";
import { useAudit } from "../context/AuditContext";
import { describeChanges } from "../utils/diff";
import { useData } from "../context/DataContext";

type NewAppt = Omit<Appointment, "id" | "status" | "scheduledBy">;
const emptyForm: NewAppt = { patientId: 0, doctorId: 0, date: "", time: "", reason: "", notes: "" };

const DOCTOR_EMAIL_MAP: Record<string, number> = { "medico@vidamaissaude.com": 1 };

interface Props { user: AuthUser; }

export default function AppointmentsPage({ user }: Props) {
  const { record } = useAudit();
  const { appointments: list, setAppointments: setList, patients, doctors } = useData();
  const isPatient = user.role === "patient";
  const isDoctor = user.role === "doctor";
  const isAttendant = user.role === "attendant";
  const isStaff = !isPatient; // admin, attendant, doctor
  const canSchedule = !isPatient && !isDoctor; // admin, attendant
  const patientId = isPatient ? (user.patientId ?? null) : null;
  const doctorId = isDoctor ? (DOCTOR_EMAIL_MAP[user.email] ?? null) : null;
  const [statusFilter, setStatusFilter] = useState<"" | "AGENDADA" | "REALIZADA" | "CANCELADA">("");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"add" | "edit" | "cancel" | "notes" | "patient" | null>(null);
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [form, setForm] = useState<NewAppt>(emptyForm);
  const [notesText, setNotesText] = useState("");
  const [editStatus, setEditStatus] = useState<Appointment["status"]>("AGENDADA");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [conflictAlert, setConflictAlert] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const baseList = (() => {
    if (isPatient && patientId !== null) return list.filter((a) => a.patientId === patientId);
    if (isDoctor && doctorId !== null) return list.filter((a) => a.doctorId === doctorId);
    return list;
  })();

  const filtered = baseList.filter((a) => {
    if (statusFilter && a.status !== statusFilter) return false;
    if (canSchedule && search) {
      const pat = patients.find((p) => p.id === a.patientId);
      const doc = doctors.find((d) => d.id === a.doctorId);
      const q = search.toLowerCase();
      return (
        String(a.id).includes(q) ||
        pat?.name.toLowerCase().includes(q) ||
        doc?.name.toLowerCase().includes(q) ||
        a.date.includes(q)
      );
    }
    return true;
  });

  const validate = (f: NewAppt) => {
    const e: Record<string, string> = {};
    if (!f.patientId) e.patientId = "Selecione um paciente";
    if (!f.doctorId) e.doctorId = "Selecione um médico";
    if (!f.date) e.date = "Data obrigatória";
    else if (f.date < today) e.date = "Data não pode ser anterior à data atual";
    if (!f.time) e.time = "Horário obrigatório";
    if (!f.reason.trim()) e.reason = "Motivo obrigatório";
    return e;
  };

  const handleAdd = () => {
    const e = validate(form);
    if (Object.keys(e).length) { setErrors(e); return; }
    const conflict = list.some((a) => a.doctorId === form.doctorId && a.date === form.date && a.time === form.time && a.status !== "CANCELADA");
    if (conflict) { setConflictAlert(true); return; }
    setList([...list, { ...form, id: list.length ? Math.max(...list.map((a) => a.id)) + 1 : 1, status: "AGENDADA", scheduledBy: user.name }]);
    const pat = patients.find((p) => p.id === form.patientId);
    record(user.name, user.role, "CRIOU", "Consulta", pat?.name ?? `Paciente #${form.patientId}`, `${form.date} ${form.time}`);
    setModal(null);
  };

  const handleEdit = () => {
    if (!selected) return;
    const e = validate(form);
    if (Object.keys(e).length) { setErrors(e); return; }
    const conflict = list.some((a) => a.doctorId === form.doctorId && a.date === form.date && a.time === form.time && a.status !== "CANCELADA" && a.id !== selected.id);
    if (conflict) { setConflictAlert(true); return; }
    setList(list.map((a) => (a.id === selected.id ? { ...a, ...form, status: editStatus } : a)));
    const pat = patients.find((p) => p.id === selected.patientId);
    const patAfter = patients.find((p) => p.id === form.patientId);
    const docBefore = doctors.find((d) => d.id === selected.doctorId);
    const docAfter = doctors.find((d) => d.id === form.doctorId);
    const detail = describeChanges(
      { patientId: selected.patientId, doctorId: selected.doctorId, date: selected.date, time: selected.time, reason: selected.reason, notes: selected.notes ?? "", status: selected.status },
      { patientId: form.patientId, doctorId: form.doctorId, date: form.date, time: form.time, reason: form.reason, notes: form.notes ?? "", status: editStatus },
      { patientId: "Paciente", doctorId: "Médico", date: "Data", time: "Horário", reason: "Motivo", notes: "Observações", status: "Status" }
    )
      .replace(`"${selected.patientId}"`, `"${pat?.name ?? selected.patientId}"`)
      .replace(`"${form.patientId}"`, `"${patAfter?.name ?? form.patientId}"`)
      .replace(`"${selected.doctorId}"`, `"${docBefore?.name ?? selected.doctorId}"`)
      .replace(`"${form.doctorId}"`, `"${docAfter?.name ?? form.doctorId}"`);
    record(user.name, user.role, "EDITOU", "Consulta", pat?.name ?? `#${selected.id}`, detail);
    setModal(null);
  };

  const handleCancel = () => {
    if (!selected) return;
    setList(list.map((a) => (a.id === selected.id ? { ...a, status: "CANCELADA" } : a)));
    const pat = patients.find((p) => p.id === selected.patientId);
    record(user.name, user.role, "CANCELOU", "Consulta", pat?.name ?? `#${selected.id}`, `${selected.date} ${selected.time}`);
    setModal(null);
  };

  const handleRealizar = (a: Appointment) => {
    setList(list.map((x) => (x.id === a.id ? { ...x, status: "REALIZADA" } : x)));
    const pat = patients.find((p) => p.id === a.patientId);
    record(user.name, user.role, "EDITOU", "Consulta", pat?.name ?? `#${a.id}`, `Realizada em ${a.date}`);
  };

  const handleSaveNotes = () => {
    if (!selected) return;
    setList(list.map((a) => (a.id === selected.id ? { ...a, notes: notesText } : a)));
    const pat = patients.find((p) => p.id === selected.patientId);
    record(user.name, user.role, "EDITOU", "Consulta", pat?.name ?? `#${selected.id}`, "Observações registradas");
    setModal(null);
  };

  const openEdit = (a: Appointment) => {
    setSelected(a);
    setForm({ patientId: a.patientId, doctorId: a.doctorId, date: a.date, time: a.time, reason: a.reason, notes: a.notes });
    setEditStatus(a.status);
    setErrors({});
    setConflictAlert(false);
    setModal("edit");
  };

  const openNotes = (a: Appointment) => {
    setSelected(a);
    setNotesText(a.notes ?? "");
    setModal("notes");
  };

  const openPatient = (a: Appointment) => {
    setSelected(a);
    setModal("patient");
  };

  const upcomingCount = (isPatient || isDoctor) ? baseList.filter((a) => a.status === "AGENDADA" && a.date >= today).length : 0;
  const title = isPatient ? "Minhas Consultas" : isDoctor ? "Minhas Consultas" : "Consultas";
  const subtitle = (() => {
    if (isPatient || isDoctor) return upcomingCount > 0 ? `${upcomingCount} próxima${upcomingCount > 1 ? "s" : ""}` : "Nenhuma consulta futura";
    return `${list.length} no sistema`;
  })();

  const STATUS_TABS = ["", "AGENDADA", "REALIZADA", "CANCELADA"] as const;
  const STATUS_LABELS: Record<string, string> = { "": "Todas", AGENDADA: "Agendadas", REALIZADA: "Realizadas", CANCELADA: "Canceladas" };

  const formFields = (
    <div className="space-y-3.5">
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Paciente *</label>
        <select value={form.patientId || ""} onChange={(e) => setForm({ ...form, patientId: Number(e.target.value) })}
          className={`w-full px-3.5 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${errors.patientId ? "border-red-300" : "border-slate-200"}`}>
          <option value="">Selecione um paciente</option>
          {patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        {errors.patientId && <p className="text-xs text-red-500 mt-0.5">{errors.patientId}</p>}
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Médico *</label>
        <select value={form.doctorId || ""} onChange={(e) => setForm({ ...form, doctorId: Number(e.target.value) })}
          className={`w-full px-3.5 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${errors.doctorId ? "border-red-300" : "border-slate-200"}`}>
          <option value="">Selecione um médico</option>
          {doctors.map((d) => <option key={d.id} value={d.id}>{d.name} – {d.specialty}</option>)}
        </select>
        {errors.doctorId && <p className="text-xs text-red-500 mt-0.5">{errors.doctorId}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Data *</label>
          <input type="date" min={today} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
            className={`w-full px-3 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${errors.date ? "border-red-300" : "border-slate-200"}`} />
          {errors.date && <p className="text-xs text-red-500 mt-0.5">{errors.date}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Horário *</label>
          <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })}
            className={`w-full px-3 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${errors.time ? "border-red-300" : "border-slate-200"}`} />
          {errors.time && <p className="text-xs text-red-500 mt-0.5">{errors.time}</p>}
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Motivo *</label>
        <input type="text" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Motivo da consulta"
          className={`w-full px-3.5 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${errors.reason ? "border-red-300" : "border-slate-200"}`} />
        {errors.reason && <p className="text-xs text-red-500 mt-0.5">{errors.reason}</p>}
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Observações</label>
        <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2}
          className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
      </div>
      {modal === "edit" && canSchedule && (
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
          <select value={editStatus} onChange={(e) => setEditStatus(e.target.value as Appointment["status"])}
            className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500">
            <option value="AGENDADA">AGENDADA</option>
            <option value="REALIZADA">REALIZADA</option>
            <option value="CANCELADA">CANCELADA</option>
          </select>
        </div>
      )}
      {conflictAlert && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
          ⚠ Já existe uma consulta neste horário para o médico selecionado.
        </div>
      )}
    </div>
  );

  return (
    <div className="px-4 py-5 md:px-8 md:py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-800" style={{ fontFamily: "Outfit, sans-serif" }}>{title}</h1>
          <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
        </div>
        {canSchedule && (
          <button onClick={() => { setForm(emptyForm); setErrors({}); setConflictAlert(false); setModal("add"); }}
            className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-semibold px-5 py-2 rounded-full shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all">
            + Agendar
          </button>
        )}
      </div>

      {/* Search (admin/attendant only) */}
      {canSchedule && (
        <div className="mb-4">
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por paciente, médico ou data..."
            className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
        </div>
      )}

      {/* Status filter tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {STATUS_TABS.map((s) => {
          const active = statusFilter === s;
          return (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border whitespace-nowrap flex-shrink-0 transition-colors ${
                active ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
              }`}>
              {STATUS_LABELS[s]}
              {s !== "" && <span className="ml-1 opacity-70">({baseList.filter((a) => a.status === s).length})</span>}
            </button>
          );
        })}
      </div>

      {/* Cards */}
      <div className="space-y-2.5 md:grid md:grid-cols-2 md:gap-3 lg:grid-cols-3 md:space-y-0">
        {filtered.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-slate-400 text-sm">Nenhuma consulta encontrada</p>
            {isPatient && statusFilter === "" && (
              <p className="text-slate-300 text-xs mt-1">Entre em contato com a recepção para agendar</p>
            )}
          </div>
        ) : filtered.map((a) => {
          const pat = patients.find((p) => p.id === a.patientId);
          const doc = doctors.find((d) => d.id === a.doctorId);
          return (
            <div key={a.id} className="bg-white border border-slate-100 rounded-2xl p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">
                    {isPatient ? doc?.name : pat?.name}
                  </p>
                  <p className="text-xs text-slate-400 truncate">
                    {isPatient ? doc?.specialty : `${doc?.name} · ${doc?.specialty}`}
                  </p>
                </div>
                <Badge status={a.status} />
              </div>
              <div className="flex gap-3 text-xs text-slate-500">
                <span>📅 {new Date(a.date + "T12:00:00").toLocaleDateString("pt-BR")}</span>
                <span>🕐 {a.time}</span>
              </div>
              <p className="text-xs text-slate-500 mt-1 truncate">{a.reason}</p>
              {a.notes && <p className="text-xs text-slate-400 mt-0.5 italic truncate">"{a.notes}"</p>}
              {canSchedule && a.scheduledBy && (
                <p className="text-xs text-slate-300 mt-1">Agendado por: {a.scheduledBy}</p>
              )}

              {/* Doctor actions */}
              {isDoctor && (
                <div className="mt-3 pt-3 border-t border-slate-50 space-y-2">
                  <button onClick={() => openPatient(a)}
                    className="w-full text-xs font-medium text-emerald-600 bg-emerald-50 active:bg-emerald-100 py-1.5 rounded-lg hover:brightness-95 transition-colors">
                    Ver dados do paciente
                  </button>
                  {a.status === "AGENDADA" && (
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => handleRealizar(a)}
                        className="text-xs font-medium text-emerald-600 bg-emerald-50 active:bg-emerald-100 py-1.5 rounded-lg hover:brightness-95 transition-colors">
                        Realizar consulta
                      </button>
                      <button onClick={() => openNotes(a)}
                        className="text-xs font-medium text-slate-600 bg-slate-50 active:bg-slate-100 py-1.5 rounded-lg hover:brightness-95 transition-colors">
                        Observações
                      </button>
                    </div>
                  )}
                  {a.status === "REALIZADA" && (
                    <button onClick={() => openNotes(a)}
                      className="w-full text-xs font-medium text-slate-600 bg-slate-50 active:bg-slate-100 py-1.5 rounded-lg hover:brightness-95 transition-colors">
                      {a.notes ? "Editar observações" : "Registrar observações"}
                    </button>
                  )}
                </div>
              )}

              {/* Attendant/admin actions */}
              {canSchedule && a.status === "AGENDADA" && (
                <div className="flex gap-2 mt-3">
                  <button onClick={() => openEdit(a)}
                    className="flex-1 text-xs font-medium text-slate-600 bg-slate-50 active:bg-slate-100 py-1.5 rounded-lg hover:brightness-95 transition-colors">
                    Editar
                  </button>
                  <button onClick={() => { setSelected(a); setModal("cancel"); }}
                    className="flex-1 text-xs font-medium text-rose-500 bg-rose-50 active:bg-rose-100 py-1.5 rounded-lg hover:brightness-95 transition-colors">
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add modal */}
      {modal === "add" && (
        <Modal title="Agendar Consulta" onClose={() => setModal(null)}>
          {formFields}
          <div className="flex gap-3 mt-5">
            <button onClick={() => setModal(null)} className="flex-1 py-3 text-sm font-medium text-emerald-700 border border-emerald-200 hover:bg-emerald-50 rounded-full transition-colors">Cancelar</button>
            <button onClick={handleAdd} className="flex-1 py-3 text-sm font-semibold text-white bg-emerald-600 rounded-full shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all">Agendar</button>
          </div>
        </Modal>
      )}

      {/* Edit modal */}
      {modal === "edit" && selected && (
        <Modal title="Editar Consulta" onClose={() => setModal(null)}>
          {formFields}
          <div className="flex gap-3 mt-5">
            <button onClick={() => setModal(null)} className="flex-1 py-3 text-sm font-medium text-emerald-700 border border-emerald-200 hover:bg-emerald-50 rounded-full transition-colors">Cancelar</button>
            <button onClick={handleEdit} className="flex-1 py-3 text-sm font-semibold text-white bg-emerald-600 rounded-full shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all">Salvar</button>
          </div>
        </Modal>
      )}

      {/* Cancel confirm */}
      {modal === "cancel" && selected && (
        <Modal title="Cancelar Consulta" onClose={() => setModal(null)}>
          <p className="text-sm text-slate-600">
            Cancelar a consulta de <strong>{patients.find((p) => p.id === selected.patientId)?.name}</strong> em{" "}
            <strong>{new Date(selected.date + "T12:00:00").toLocaleDateString("pt-BR")}</strong> às <strong>{selected.time}</strong>?
          </p>
          <p className="text-xs text-slate-400 mt-1">O histórico será mantido com status CANCELADA.</p>
          <div className="flex gap-3 mt-5">
            <button onClick={() => setModal(null)} className="flex-1 py-3 text-sm font-medium text-emerald-700 border border-emerald-200 hover:bg-emerald-50 rounded-full transition-colors">Voltar</button>
            <button onClick={handleCancel} className="flex-1 py-3 text-sm font-semibold text-white bg-rose-500 rounded-full shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all">Confirmar</button>
          </div>
        </Modal>
      )}

      {/* Notes modal (doctor) */}
      {modal === "notes" && selected && (
        <Modal title="Observações da Consulta" onClose={() => setModal(null)}>
          <div className="mb-3">
            <p className="text-xs text-slate-500 mb-1">
              {patients.find((p) => p.id === selected.patientId)?.name} · {new Date(selected.date + "T12:00:00").toLocaleDateString("pt-BR")} às {selected.time}
            </p>
            <p className="text-xs text-slate-400 truncate">{selected.reason}</p>
          </div>
          <textarea
            value={notesText}
            onChange={(e) => setNotesText(e.target.value)}
            rows={5}
            placeholder="Registre suas observações clínicas, diagnóstico, prescrições..."
            className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
          />
          <div className="flex gap-3 mt-5">
            <button onClick={() => setModal(null)} className="flex-1 py-3 text-sm font-medium text-emerald-700 border border-emerald-200 hover:bg-emerald-50 rounded-full transition-colors">Cancelar</button>
            <button onClick={handleSaveNotes} className="flex-1 py-3 text-sm font-semibold text-white bg-emerald-600 rounded-full shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all">Salvar</button>
          </div>
        </Modal>
      )}

      {/* Patient data modal (doctor) */}
      {modal === "patient" && selected && (() => {
        const pat = patients.find((p) => p.id === selected.patientId);
        if (!pat) return null;
        return (
          <Modal title="Dados do Paciente" onClose={() => setModal(null)}>
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100">
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 font-bold text-lg flex-shrink-0">
                {pat.name.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{pat.name}</p>
                <p className="text-xs text-slate-400">{pat.cpf}</p>
              </div>
            </div>
            <div className="space-y-2.5">
              {[
                ["Data de nascimento", new Date(pat.dob + "T12:00:00").toLocaleDateString("pt-BR")],
                ["Telefone", pat.phone || "—"],
                ["E-mail", pat.email || "—"],
                ["Endereço", pat.address || "—"],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between py-1.5 border-b border-slate-50 last:border-0">
                  <span className="text-xs text-slate-400">{l}</span>
                  <span className="text-xs font-medium text-slate-700 text-right max-w-[55%]">{v}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setModal(null)} className="w-full mt-5 py-3 text-sm font-semibold text-white bg-emerald-600 rounded-full shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all">Fechar</button>
          </Modal>
        );
      })()}
    </div>
  );
}
