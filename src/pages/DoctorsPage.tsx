import { useState } from "react";
import type { Doctor } from "../data/mock";
import Modal from "../components/Modal";
import { useAudit } from "../context/AuditContext";
import { useData } from "../context/DataContext";
import type { AuthUser } from "../App";
import { maskCRM, maskPhone, normalizeCRM } from "../utils/masks";
import { describeChanges } from "../utils/diff";

const empty: Omit<Doctor, "id"> = { name: "", crm: "", specialty: "", phone: "", email: "" };
const SPECIALTIES = ["Clínica Geral", "Cardiologia", "Ortopedia", "Pediatria", "Dermatologia", "Neurologia", "Ginecologia", "Oftalmologia"];

interface Props { user: AuthUser; }

export default function DoctorsPage({ user }: Props) {
  const { record } = useAudit();
  const { doctors: list, setDoctors: setList, appointments, sysUsers, setSysUsers } = useData();
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [selected, setSelected] = useState<Doctor | null>(null);
  const [form, setForm] = useState<Omit<Doctor, "id">>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteAlert, setDeleteAlert] = useState<Doctor | null>(null);
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);

  const filtered = list.filter(
    (d) => d.name.toLowerCase().includes(search.toLowerCase()) || d.specialty.toLowerCase().includes(search.toLowerCase()) || d.crm.toLowerCase().includes(search.toLowerCase())
  );

  const validate = (data: typeof form, excludeId?: number, isNew?: boolean) => {
    const e: Record<string, string> = {};
    if (!data.name.trim()) e.name = "Nome obrigatório";
    if (!data.crm.trim()) e.crm = "CRM obrigatório";
    else if (list.some((d) => normalizeCRM(d.crm) === normalizeCRM(data.crm) && d.id !== excludeId)) e.crm = "CRM já cadastrado";
    if (!data.specialty) e.specialty = "Especialidade obrigatória";
    if (isNew) {
      if (!data.email.trim()) e.email = "E-mail obrigatório para acesso ao sistema";
      else if (sysUsers.some((u) => u.email.toLowerCase() === data.email.trim().toLowerCase())) e.email = "Já existe uma conta com este e-mail";
    }
    return e;
  };

  const openAdd = () => { setForm(empty); setErrors({}); setSelected(null); setModal("add"); };
  const openEdit = (d: Doctor) => { setSelected(d); setForm({ name: d.name, crm: d.crm, specialty: d.specialty, phone: d.phone, email: d.email }); setErrors({}); setModal("edit"); };

  const handleSave = () => {
    const e = validate(form, selected?.id, modal === "add");
    if (Object.keys(e).length) { setErrors(e); return; }
    if (modal === "add") {
      const newId = list.length ? Math.max(...list.map((d) => d.id)) + 1 : 1;
      setList([...list, { ...form, id: newId }]);
      record(user.name, user.role, "CRIOU", "Médico", form.name, `CRM: ${form.crm}`);

      const provisionalPassword = normalizeCRM(form.crm).slice(-6);
      const newUserId = sysUsers.length ? Math.max(...sysUsers.map((u) => u.id)) + 1 : 1;
      setSysUsers([
        ...sysUsers,
        {
          id: newUserId,
          name: form.name,
          email: form.email.trim(),
          role: "doctor",
          active: true,
          password: provisionalPassword,
          doctorId: newId,
          mustChangePassword: true,
        },
      ]);
      setCredentials({ email: form.email.trim(), password: provisionalPassword });
    } else if (selected) {
      setList(list.map((d) => (d.id === selected.id ? { ...d, ...form } : d)));
      const detail = describeChanges(
        { name: selected.name, crm: selected.crm, specialty: selected.specialty, phone: selected.phone, email: selected.email },
        { name: form.name, crm: form.crm, specialty: form.specialty, phone: form.phone, email: form.email },
        { name: "Nome", crm: "CRM", specialty: "Especialidade", phone: "Telefone", email: "E-mail" }
      );
      record(user.name, user.role, "EDITOU", "Médico", selected.name, detail);
    }
    setModal(null);
  };

  const handleDelete = (d: Doctor) => {
    if (appointments.some((a) => a.doctorId === d.id)) { setDeleteAlert(d); return; }
    record(user.name, user.role, "EXCLUIU", "Médico", d.name, `CRM: ${d.crm}`);
    setList(list.filter((x) => x.id !== d.id));
  };

  return (
    <div className="px-4 py-5 md:px-8 md:py-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-800" style={{ fontFamily: "Outfit, sans-serif" }}>Médicos</h1>
          <p className="text-xs text-slate-400 mt-0.5">{list.length} cadastrados</p>
        </div>
        <button onClick={openAdd} className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-semibold px-5 py-2 rounded-full shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all">
          + Novo
        </button>
      </div>

      <div className="mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome, CRM ou especialidade..."
          className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        />
      </div>

      <div className="space-y-2.5 md:grid md:grid-cols-2 md:gap-3 lg:grid-cols-3 md:space-y-0">
        {filtered.map((d) => (
          <div key={d.id} className="bg-white border border-slate-100 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-700 font-semibold flex-shrink-0">
                {d.name.replace("Dr. ", "").replace("Dra. ", "").charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800">{d.name}</p>
                <span className="inline-block text-[10px] font-medium bg-teal-50 text-teal-700 border border-teal-100 px-2 py-0.5 rounded-full mt-0.5">{d.specialty}</span>
                <p className="text-xs text-slate-400 mt-1 font-mono">{d.crm}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-3 pt-3 border-t border-slate-50">
              <button onClick={() => openEdit(d)} className="flex-1 text-xs font-medium text-slate-600 bg-slate-50 active:bg-slate-100 py-1.5 rounded-lg hover:brightness-95 transition-colors">Editar</button>
              <button onClick={() => handleDelete(d)} className="flex-1 text-xs font-medium text-rose-500 bg-rose-50 active:bg-rose-100 py-1.5 rounded-lg hover:brightness-95 transition-colors">Excluir</button>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <Modal title={modal === "add" ? "Novo Médico" : "Editar Médico"} onClose={() => setModal(null)}>
          <div className="space-y-3.5">
            {/* Nome */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Nome completo *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={`w-full px-3.5 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${errors.name ? "border-red-300" : "border-slate-200"}`} />
              {errors.name && <p className="text-xs text-red-500 mt-0.5">{errors.name}</p>}
            </div>
            {/* CRM */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">CRM *</label>
              <input
                value={form.crm}
                onChange={(e) => setForm({ ...form, crm: maskCRM(e.target.value) })}
                placeholder="CRM-SP 000000"
                maxLength={14}
                className={`w-full px-3.5 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${errors.crm ? "border-red-300" : "border-slate-200"}`}
              />
              {errors.crm && <p className="text-xs text-red-500 mt-0.5">{errors.crm}</p>}
            </div>
            {/* Telefone */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Telefone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: maskPhone(e.target.value) })}
                placeholder="(00) 00000-0000"
                maxLength={15}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            {/* E-mail */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">E-mail{modal === "add" ? " *" : ""}</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={`w-full px-3.5 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${errors.email ? "border-red-300" : "border-slate-200"}`} />
              {errors.email && <p className="text-xs text-red-500 mt-0.5">{errors.email}</p>}
              {modal === "add" && !errors.email && (
                <p className="text-xs text-slate-400 mt-0.5">Esse e-mail será usado como login do médico.</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Especialidade *</label>
              <select
                value={form.specialty}
                onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                className={`w-full px-3.5 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${errors.specialty ? "border-red-300" : "border-slate-200"}`}
              >
                <option value="">Selecione...</option>
                {SPECIALTIES.map((s) => <option key={s}>{s}</option>)}
              </select>
              {errors.specialty && <p className="text-xs text-red-500 mt-0.5">{errors.specialty}</p>}
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <button onClick={() => setModal(null)} className="flex-1 py-3 text-sm font-medium text-emerald-700 border border-emerald-200 hover:bg-emerald-50 rounded-full transition-colors">Cancelar</button>
            <button onClick={handleSave} className="flex-1 py-3 text-sm font-semibold text-white bg-emerald-600 rounded-full shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all">Salvar</button>
          </div>
        </Modal>
      )}

      {deleteAlert && (
        <Modal title="Não é possível excluir" onClose={() => setDeleteAlert(null)}>
          <p className="text-sm text-slate-600">{deleteAlert.name} possui consultas vinculadas e não pode ser excluído.</p>
          <button onClick={() => setDeleteAlert(null)} className="w-full mt-5 py-3 text-sm font-semibold text-white bg-emerald-600 rounded-full shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all">Entendido</button>
        </Modal>
      )}

      {credentials && (
        <Modal title="Médico cadastrado" onClose={() => setCredentials(null)}>
          <p className="text-sm text-slate-600 mb-4">
            O acesso ao sistema foi criado automaticamente. Repasse estes dados ao médico — ele será obrigado a criar uma nova senha no primeiro login.
          </p>
          <div className="bg-slate-50 rounded-xl p-3 space-y-2">
            <div className="flex justify-between">
              <span className="text-xs text-slate-400">E-mail</span>
              <span className="text-sm font-semibold text-slate-700">{credentials.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-slate-400">Senha provisória</span>
              <span className="text-sm font-semibold text-slate-700 font-mono">{credentials.password}</span>
            </div>
          </div>
          <button onClick={() => setCredentials(null)} className="w-full mt-5 py-3 text-sm font-semibold text-white bg-emerald-600 rounded-full shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all">Entendido</button>
        </Modal>
      )}
    </div>
  );
}
