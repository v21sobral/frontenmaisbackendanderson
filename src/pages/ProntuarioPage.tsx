import { useState } from "react";
import Modal from "../components/Modal";
import { useData, type Prontuario } from "../context/DataContext";
import type { AuthUser } from "../App";

const emptyForm = { title: "", content: "", patientId: 0, appointmentId: undefined as number | undefined };

interface Props { user: AuthUser; }

export default function ProntuarioPage({ user }: Props) {
  const { prontuarios, setProntuarios, patients, doctors, appointments } = useData();
  const isDoctor = user.role === "doctor";
  const isPatient = user.role === "patient";

  const doctorId = isDoctor ? (user.doctorId ?? null) : null;
  const patientId = isPatient ? (user.patientId ?? null) : null;

  const [modal, setModal] = useState<"add" | "edit" | "view" | "delete" | null>(null);
  const [selected, setSelected] = useState<Prontuario | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");

  const myList = (() => {
    if (isDoctor && doctorId !== null) return prontuarios.filter((p) => p.doctorId === doctorId);
    if (isPatient && patientId !== null) return prontuarios.filter((p) => p.patientId === patientId);
    return prontuarios;
  })();

  const filtered = myList.filter((p) => {
    if (!search) return true;
    const pat = patients.find((x) => x.id === p.patientId);
    const q = search.toLowerCase();
    return p.title.toLowerCase().includes(q) || pat?.name.toLowerCase().includes(q);
  });

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = "Título obrigatório";
    if (!form.content.trim()) e.content = "Conteúdo obrigatório";
    if (!form.patientId) e.patientId = "Paciente obrigatório";
    return e;
  };

  const openAdd = () => {
    setForm({ ...emptyForm });
    setErrors({});
    setSelected(null);
    setModal("add");
  };

  const openEdit = (p: Prontuario) => {
    setSelected(p);
    setForm({ title: p.title, content: p.content, patientId: p.patientId, appointmentId: p.appointmentId });
    setErrors({});
    setModal("edit");
  };

  const openView = (p: Prontuario) => { setSelected(p); setModal("view"); };
  const openDelete = (p: Prontuario) => { setSelected(p); setModal("delete"); };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    const today = new Date().toISOString().split("T")[0];
    if (modal === "add" && doctorId !== null) {
      setProntuarios([...prontuarios, {
        ...form,
        id: Math.max(0, ...prontuarios.map((x) => x.id)) + 1,
        doctorId,
        date: today,
        appointmentId: form.appointmentId || undefined,
      }]);
    } else if (modal === "edit" && selected) {
      setProntuarios(prontuarios.map((x) => x.id === selected.id
        ? { ...x, title: form.title, content: form.content, patientId: form.patientId, appointmentId: form.appointmentId || undefined }
        : x
      ));
    }
    setModal(null);
  };

  const handleDelete = () => {
    if (!selected) return;
    setProntuarios(prontuarios.filter((x) => x.id !== selected.id));
    setModal(null);
  };

  const myAppts = isDoctor && doctorId !== null
    ? appointments.filter((a) => a.doctorId === doctorId && a.status === "REALIZADA")
    : [];

  return (
    <div className="px-4 py-5 md:px-8 md:py-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-800" style={{ fontFamily: "Outfit, sans-serif" }}>
            {isPatient ? "Meu Prontuário" : "Prontuários"}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {isPatient
              ? `${myList.length} registro${myList.length !== 1 ? "s" : ""}`
              : `${myList.length} registro${myList.length !== 1 ? "s" : ""} cadastrado${myList.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        {isDoctor && (
          <button onClick={openAdd} className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-semibold px-5 py-2 rounded-full shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all">
            + Novo
          </button>
        )}
      </div>

      {isDoctor && (
        <div className="mb-4">
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por paciente ou título..."
            className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
        </div>
      )}

      <div className="space-y-2.5 md:grid md:grid-cols-2 md:gap-3 lg:grid-cols-3 md:space-y-0">
        {filtered.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-slate-400 text-sm">Nenhum prontuário encontrado</p>
            {isPatient && <p className="text-slate-300 text-xs mt-1">Os registros do seu médico aparecerão aqui</p>}
          </div>
        ) : filtered.map((p) => {
          const pat = patients.find((x) => x.id === p.patientId);
          const doc = doctors.find((x) => x.id === p.doctorId);
          return (
            <div key={p.id} className="bg-white border border-slate-100 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600 flex-shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M12 12h4M12 16h4M8 12h.01M8 16h.01" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{p.title}</p>
                  {isDoctor && <p className="text-xs text-slate-400 truncate">{pat?.name}</p>}
                  {isPatient && <p className="text-xs text-slate-400 truncate">{doc?.name}</p>}
                  <p className="text-xs text-slate-300 mt-0.5">
                    {new Date(p.date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">{p.content}</p>
              <div className={`flex gap-2 mt-3 pt-3 border-t border-slate-50 ${isPatient ? "" : ""}`}>
                <button onClick={() => openView(p)}
                  className="flex-1 text-xs font-medium text-violet-600 bg-violet-50 active:bg-violet-100 py-1.5 rounded-lg hover:brightness-95 transition-colors">
                  Ver completo
                </button>
                {isDoctor && (
                  <>
                    <button onClick={() => openEdit(p)}
                      className="flex-1 text-xs font-medium text-slate-600 bg-slate-50 active:bg-slate-100 py-1.5 rounded-lg hover:brightness-95 transition-colors">
                      Editar
                    </button>
                    <button onClick={() => openDelete(p)}
                      className="flex-1 text-xs font-medium text-rose-500 bg-rose-50 active:bg-rose-100 py-1.5 rounded-lg hover:brightness-95 transition-colors">
                      Excluir
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit modal */}
      {(modal === "add" || modal === "edit") && (
        <Modal title={modal === "add" ? "Novo Prontuário" : "Editar Prontuário"} onClose={() => setModal(null)}>
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
              <label className="block text-xs font-medium text-slate-600 mb-1">Consulta relacionada (opcional)</label>
              <select value={form.appointmentId ?? ""} onChange={(e) => setForm({ ...form, appointmentId: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="">Nenhuma</option>
                {myAppts.filter((a) => !form.patientId || a.patientId === form.patientId).map((a) => {
                  const pat = patients.find((p) => p.id === a.patientId);
                  return <option key={a.id} value={a.id}>{new Date(a.date + "T12:00:00").toLocaleDateString("pt-BR")} — {pat?.name}</option>;
                })}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Título *</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Ex: Consulta de rotina, Retorno pós-exame..."
                className={`w-full px-3.5 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${errors.title ? "border-red-300" : "border-slate-200"}`} />
              {errors.title && <p className="text-xs text-red-500 mt-0.5">{errors.title}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Registro clínico *</label>
              <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={6} placeholder="Anamnese, diagnóstico, prescrição, observações..."
                className={`w-full px-3.5 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none leading-relaxed ${errors.content ? "border-red-300" : "border-slate-200"}`} />
              {errors.content && <p className="text-xs text-red-500 mt-0.5">{errors.content}</p>}
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <button onClick={() => setModal(null)} className="flex-1 py-3 text-sm font-medium text-emerald-700 border border-emerald-200 hover:bg-emerald-50 rounded-full transition-colors">Cancelar</button>
            <button onClick={handleSave} className="flex-1 py-3 text-sm font-semibold text-white bg-emerald-600 rounded-full shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all">
              {modal === "add" ? "Registrar" : "Salvar"}
            </button>
          </div>
        </Modal>
      )}

      {/* View modal */}
      {modal === "view" && selected && (() => {
        const pat = patients.find((x) => x.id === selected.patientId);
        const doc = doctors.find((x) => x.id === selected.doctorId);
        const appt = appointments.find((x) => x.id === selected.appointmentId);
        return (
          <Modal title="Prontuário" onClose={() => setModal(null)}>
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1.5">
                {isPatient && <div className="flex justify-between"><span className="text-xs text-slate-400">Médico</span><span className="text-xs font-medium text-slate-700">{doc?.name}</span></div>}
                {isDoctor && <div className="flex justify-between"><span className="text-xs text-slate-400">Paciente</span><span className="text-xs font-medium text-slate-700">{pat?.name}</span></div>}
                <div className="flex justify-between"><span className="text-xs text-slate-400">Data</span><span className="text-xs font-medium text-slate-700">{new Date(selected.date + "T12:00:00").toLocaleDateString("pt-BR")}</span></div>
                {appt && <div className="flex justify-between"><span className="text-xs text-slate-400">Consulta</span><span className="text-xs font-medium text-slate-700">{new Date(appt.date + "T12:00:00").toLocaleDateString("pt-BR")} às {appt.time}</span></div>}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 mb-2">{selected.title}</p>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{selected.content}</p>
              </div>
            </div>
            <button onClick={() => setModal(null)} className="w-full mt-5 py-3 text-sm font-semibold text-white bg-emerald-600 rounded-full shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all">Fechar</button>
          </Modal>
        );
      })()}

      {/* Delete confirm */}
      {modal === "delete" && selected && (
        <Modal title="Excluir Prontuário" onClose={() => setModal(null)}>
          <p className="text-sm text-slate-600">
            Excluir o prontuário <strong>"{selected.title}"</strong>? Esta ação não pode ser desfeita.
          </p>
          <div className="flex gap-3 mt-5">
            <button onClick={() => setModal(null)} className="flex-1 py-3 text-sm font-medium text-emerald-700 border border-emerald-200 hover:bg-emerald-50 rounded-full transition-colors">Cancelar</button>
            <button onClick={handleDelete} className="flex-1 py-3 text-sm font-semibold text-white bg-rose-500 rounded-full shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all">Excluir</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
