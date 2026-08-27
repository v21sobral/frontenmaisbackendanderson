import { useState } from "react";
import { type Exam } from "../data/mock";
import Modal from "../components/Modal";
import Badge from "../components/Badge";
import type { AuthUser } from "../App";
import { useAudit } from "../context/AuditContext";
import { describeChanges } from "../utils/diff";
import { useData } from "../context/DataContext";

type ExamStatus = "SOLICITADO" | "AGENDADO" | "REALIZADO" | "CANCELADO";
const EXAM_TYPES = ["Laboratorial", "Imagem", "Cardiológico", "Neurológico", "Oftalmológico", "Outro"];

const PATIENT_EMAIL_MAP: Record<string, number> = { "paciente@vidamaissaude.com": 1 };
const DOCTOR_EMAIL_MAP: Record<string, number> = { "medico@vidamaissaude.com": 1 };

const emptyForm = {
  name: "", type: "", patientId: 0, doctorId: 0,
  appointmentId: undefined as number | undefined,
  requestDate: new Date().toISOString().split("T")[0],
  realizationDate: "", result: "", notes: "", status: "SOLICITADO" as ExamStatus,
};

interface Props { user: AuthUser; }

export default function ExamsPage({ user }: Props) {
  const { record } = useAudit();
  const { exams: list, setExams: setList, patients, doctors } = useData();
  const isPatient = user.role === "patient";
  const isDoctor = user.role === "doctor";
  const isAttendant = user.role === "attendant";
  const canSolicit = isDoctor; // apenas o médico solicita um novo exame
  const canEdit = !isPatient && !isDoctor; // admin, attendant (agendar/editar/registrar resultado)
  const patientId = isPatient ? (PATIENT_EMAIL_MAP[user.email] ?? null) : null;
  const doctorId = isDoctor ? (DOCTOR_EMAIL_MAP[user.email] ?? null) : null;
  const [statusFilter, setStatusFilter] = useState<"" | ExamStatus>("");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"add" | "edit" | "result" | false>(false);
  const [selected, setSelected] = useState<Exam | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [resultText, setResultText] = useState("");

  const baseList = (() => {
    if (isPatient && patientId !== null) return list.filter((e) => e.patientId === patientId);
    if (isDoctor && doctorId !== null) return list.filter((e) => e.doctorId === doctorId);
    return list;
  })();

  const filtered = baseList.filter((e) => {
    if (statusFilter && e.status !== statusFilter) return false;
    if (canEdit && search) {
      const pat = patients.find((p) => p.id === e.patientId);
      const q = search.toLowerCase();
      return e.name.toLowerCase().includes(q) || pat?.name.toLowerCase().includes(q) || e.type.toLowerCase().includes(q);
    }
    return true;
  });

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Nome obrigatório";
    if (!form.type) e.type = "Tipo obrigatório";
    if (!form.patientId) e.patientId = "Paciente obrigatório";
    if (!form.doctorId) e.doctorId = "Médico obrigatório";
    return e;
  };

  const openEdit = (exam: Exam) => {
    setSelected(exam);
    setForm({
      name: exam.name, type: exam.type, patientId: exam.patientId, doctorId: exam.doctorId,
      appointmentId: exam.appointmentId, requestDate: exam.requestDate,
      realizationDate: exam.realizationDate ?? "", result: exam.result ?? "",
      notes: exam.notes ?? "", status: exam.status,
    });
    setErrors({});
    setModal("edit");
  };

  const openResult = (exam: Exam) => {
    setSelected(exam);
    setResultText(exam.result ?? "");
    setModal("result");
  };

  const handleSaveResult = () => {
    if (!selected) return;
    setList(list.map((x) => x.id === selected.id
      ? { ...x, result: resultText, status: "REALIZADO" as ExamStatus, realizationDate: new Date().toISOString().split("T")[0] }
      : x
    ));
    const pat = patients.find((p) => p.id === selected.patientId);
    record(user.name, user.role, "EDITOU", "Exame", selected.name, `Resultado registrado — ${pat?.name ?? ""}`);
    setModal(false);
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    if (modal === "edit" && selected) {
      setList(list.map((x) => x.id === selected.id ? {
        ...x, ...form,
        realizationDate: form.realizationDate || undefined,
        result: form.result || undefined,
        notes: form.notes || undefined,
        appointmentId: form.appointmentId || undefined,
      } : x));
      const detail = describeChanges(
        { name: selected.name, type: selected.type, realizationDate: selected.realizationDate ?? "", result: selected.result ?? "", notes: selected.notes ?? "", status: selected.status },
        { name: form.name, type: form.type, realizationDate: form.realizationDate, result: form.result, notes: form.notes, status: form.status },
        { name: "Nome", type: "Tipo", realizationDate: "Data de realização", result: "Resultado", notes: "Observações", status: "Status" }
      );
      record(user.name, user.role, "EDITOU", "Exame", selected.name, detail);
    } else {
      if (!canSolicit) { setModal(false); return; }
      const newExam = {
        ...form, id: list.length ? Math.max(...list.map((x) => x.id)) + 1 : 1,
        realizationDate: form.realizationDate || undefined,
        result: form.result || undefined,
        notes: form.notes || undefined,
        appointmentId: form.appointmentId || undefined,
        scheduledBy: user.name,
      };
      setList([...list, newExam]);
      const pat = patients.find((p) => p.id === form.patientId);
      record(user.name, user.role, "CRIOU", "Exame", form.name, `Paciente: ${pat?.name ?? ""}`);
    }
    setModal(false);
  };

  const STATUS_TABS = ["", "SOLICITADO", "AGENDADO", "REALIZADO", "CANCELADO"] as const;
  const STATUS_LABELS: Record<string, string> = { "": "Todos", SOLICITADO: "Solicitados", AGENDADO: "Agendados", REALIZADO: "Realizados", CANCELADO: "Cancelados" };
  const statusColors: Record<string, string> = {
    SOLICITADO: "bg-amber-50 text-amber-700 border-amber-100",
    AGENDADO: "bg-blue-50 text-blue-700 border-blue-100",
    REALIZADO: "bg-emerald-50 text-emerald-700 border-emerald-100",
    CANCELADO: "bg-rose-50 text-rose-600 border-rose-100",
  };

  return (
    <div className="px-4 py-5 md:px-8 md:py-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-800" style={{ fontFamily: "Outfit, sans-serif" }}>
            {isPatient ? "Meus Exames" : "Exames"}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {isPatient
              ? `${baseList.length} exame${baseList.length !== 1 ? "s" : ""} registrado${baseList.length !== 1 ? "s" : ""}`
              : `${list.length} no sistema`}
          </p>
        </div>
        {canSolicit && (
          <button
            onClick={() => {
              setSelected(null);
              setForm({ ...emptyForm, ...(isDoctor && doctorId ? { doctorId } : {}) });
              setErrors({});
              setModal("add");
            }}
            className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-semibold px-5 py-2 rounded-full shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all">
            + Solicitar
          </button>
        )}
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {STATUS_TABS.map((s) => {
          const active = statusFilter === s;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border whitespace-nowrap flex-shrink-0 transition-colors ${
                active
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
              }`}
            >
              {STATUS_LABELS[s]}
              {s !== "" && (
                <span className="ml-1 opacity-70">({baseList.filter((e) => e.status === s).length})</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search (admin/attendant only) */}
      {canEdit && (
        <div className="mb-4">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar exame ou paciente..."
            className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
        </div>
      )}

      <div className="space-y-2.5 md:grid md:grid-cols-2 md:gap-3 lg:grid-cols-3 md:space-y-0">
        {filtered.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-slate-400 text-sm">Nenhum exame encontrado</p>
            {isPatient && statusFilter === "" && (
              <p className="text-slate-300 text-xs mt-1">Seus exames aparecerão aqui quando solicitados</p>
            )}
          </div>
        ) : filtered.map((e) => {
          const pat = patients.find((p) => p.id === e.patientId);
          const doc = doctors.find((d) => d.id === e.doctorId);
          return (
            <div key={e.id} className="bg-white border border-slate-100 rounded-2xl p-4">
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <p className="text-sm font-semibold text-slate-800 flex-1 min-w-0 truncate">{e.name}</p>
                <Badge status={e.status as any} />
              </div>
              <p className="text-xs text-slate-400">
                {e.type}{(!isPatient) && ` · ${pat?.name}`}
              </p>
              {!isDoctor && <p className="text-xs text-slate-400">{doc?.name}</p>}
              <div className="flex gap-3 mt-2 text-xs text-slate-400">
                <span>Solicitado: {new Date(e.requestDate + "T12:00:00").toLocaleDateString("pt-BR")}</span>
                {e.realizationDate && <span>Realizado: {new Date(e.realizationDate + "T12:00:00").toLocaleDateString("pt-BR")}</span>}
              </div>
              {canEdit && e.scheduledBy && (
                <p className="text-xs text-slate-300 mt-1">Registrado por: {e.scheduledBy}</p>
              )}
              {e.result && <p className="text-xs text-emerald-600 mt-1 font-medium">✓ {e.result}</p>}
              {/* Attendant/admin: full edit */}
              {canEdit && (
                <div className="mt-3 pt-3 border-t border-slate-50">
                  <button onClick={() => openEdit(e)}
                    className="w-full text-xs font-medium text-slate-600 bg-slate-50 active:bg-slate-100 py-1.5 rounded-lg hover:brightness-95 transition-colors">
                    Editar
                  </button>
                </div>
              )}
              {/* Doctor: register result */}
              {isDoctor && (e.status === "SOLICITADO" || e.status === "AGENDADO" || e.status === "REALIZADO") && (
                <div className="mt-3 pt-3 border-t border-slate-50">
                  <button onClick={() => openResult(e)}
                    className="w-full text-xs font-medium text-teal-600 bg-teal-50 active:bg-teal-100 py-1.5 rounded-lg hover:brightness-95 transition-colors">
                    {e.result ? "Editar resultado" : "Registrar resultado"}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {(modal === "add" || modal === "edit") && (
        <Modal title={modal === "edit" ? "Editar Exame" : "Solicitar Exame"} onClose={() => setModal(false)}>
          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Nome do exame *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Hemograma Completo"
                className={`w-full px-3.5 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${errors.name ? "border-red-300" : "border-slate-200"}`} />
              {errors.name && <p className="text-xs text-red-500 mt-0.5">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Tipo *</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                className={`w-full px-3.5 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${errors.type ? "border-red-300" : "border-slate-200"}`}>
                <option value="">Selecione...</option>
                {EXAM_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
              {errors.type && <p className="text-xs text-red-500 mt-0.5">{errors.type}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Paciente *</label>
              <select value={form.patientId || ""} onChange={(e) => setForm({ ...form, patientId: Number(e.target.value) })}
                className={`w-full px-3.5 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${errors.patientId ? "border-red-300" : "border-slate-200"}`}>
                <option value="">Selecione...</option>
                {patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              {errors.patientId && <p className="text-xs text-red-500 mt-0.5">{errors.patientId}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Médico solicitante *</label>
              {isDoctor ? (
                <div className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-600">
                  {doctors.find((d) => d.id === form.doctorId)?.name ?? user.name}
                </div>
              ) : (
                <select value={form.doctorId || ""} onChange={(e) => setForm({ ...form, doctorId: Number(e.target.value) })}
                  className={`w-full px-3.5 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${errors.doctorId ? "border-red-300" : "border-slate-200"}`}>
                  <option value="">Selecione...</option>
                  {doctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              )}
              {errors.doctorId && <p className="text-xs text-red-500 mt-0.5">{errors.doctorId}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Data de solicitação</label>
              <input type="date" value={form.requestDate} onChange={(e) => setForm({ ...form, requestDate: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            {modal === "edit" && (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ExamStatus })}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  {(["SOLICITADO","AGENDADO","REALIZADO","CANCELADO"] as ExamStatus[]).map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Resultado (opcional)</label>
              <input value={form.result} onChange={(e) => setForm({ ...form, result: e.target.value })} placeholder="Deixe em branco se pendente"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <button onClick={() => setModal(false)} className="flex-1 py-3 text-sm font-medium text-emerald-700 border border-emerald-200 hover:bg-emerald-50 rounded-full transition-colors">Cancelar</button>
            <button onClick={handleSave} className="flex-1 py-3 text-sm font-semibold text-white bg-emerald-600 rounded-full shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all">
              {modal === "edit" ? "Salvar" : "Solicitar"}
            </button>
          </div>
        </Modal>
      )}

      {/* Register result modal (doctor) */}
      {modal === "result" && selected && (
        <Modal title="Registrar Resultado" onClose={() => setModal(false)}>
          <div className="mb-4 p-3 bg-slate-50 rounded-xl">
            <p className="text-sm font-medium text-slate-700">{selected.name}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {patients.find((p) => p.id === selected.patientId)?.name} · {selected.type}
            </p>
          </div>
          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Data de realização</label>
              <input type="date" defaultValue={selected.realizationDate ?? new Date().toISOString().split("T")[0]}
                id="realizationDate"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Resultado *</label>
              <textarea
                value={resultText}
                onChange={(e) => setResultText(e.target.value)}
                rows={4}
                placeholder="Descreva o resultado do exame..."
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <button onClick={() => setModal(false)} className="flex-1 py-3 text-sm font-medium text-emerald-700 border border-emerald-200 hover:bg-emerald-50 rounded-full transition-colors">Cancelar</button>
            <button onClick={handleSaveResult} className="flex-1 py-3 text-sm font-semibold text-white bg-teal-600 rounded-full shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all">Salvar resultado</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
