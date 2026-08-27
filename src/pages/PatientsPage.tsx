import { useState } from "react";
import type { Patient } from "../data/mock";
import Modal from "../components/Modal";
import { useAudit } from "../context/AuditContext";
import { useData } from "../context/DataContext";
import type { AuthUser } from "../App";
import { maskCPF, maskPhone, normalizeCPF } from "../utils/masks";
import { describeChanges } from "../utils/diff";

const empty: Omit<Patient, "id"> = { name: "", cpf: "", phone: "", email: "", dob: "", address: "" };

interface Props { user: AuthUser; }

export default function PatientsPage({ user }: Props) {
  const { record } = useAudit();
  const { patients: list, setPatients: setList, appointments } = useData();
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"add" | "edit" | "view" | null>(null);
  const [selected, setSelected] = useState<Patient | null>(null);
  const [form, setForm] = useState<Omit<Patient, "id">>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteAlert, setDeleteAlert] = useState<Patient | null>(null);

  const filtered = list.filter(
    (p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.cpf.includes(search) || String(p.id).includes(search)
  );

  const validate = (data: typeof form, excludeId?: number) => {
    const e: Record<string, string> = {};
    if (!data.name.trim()) e.name = "Nome obrigatório";
    if (!data.cpf.trim()) e.cpf = "CPF obrigatório";
    else if (list.some((p) => normalizeCPF(p.cpf) === normalizeCPF(data.cpf) && p.id !== excludeId)) e.cpf = "CPF já cadastrado";
    if (!data.dob) e.dob = "Data de nascimento obrigatória";
    return e;
  };

  const openAdd = () => { setForm(empty); setErrors({}); setSelected(null); setModal("add"); };
  const openEdit = (p: Patient) => {
    setSelected(p);
    setForm({ name: p.name, cpf: p.cpf, phone: p.phone, email: p.email, dob: p.dob, address: p.address });
    setErrors({});
    setModal("edit");
  };
  const openView = (p: Patient) => { setSelected(p); setModal("view"); };

  const handleSave = () => {
    const e = validate(form, selected?.id);
    if (Object.keys(e).length) { setErrors(e); return; }
    if (modal === "add") {
      setList([...list, { ...form, id: list.length ? Math.max(...list.map((p) => p.id)) + 1 : 1 }]);
      record(user.name, user.role, "CRIOU", "Paciente", form.name, `CPF: ${form.cpf}`);
    } else if (selected) {
      setList(list.map((p) => (p.id === selected.id ? { ...p, ...form } : p)));
      const detail = describeChanges(
        { name: selected.name, cpf: selected.cpf, phone: selected.phone, email: selected.email, dob: selected.dob, address: selected.address },
        { name: form.name, cpf: form.cpf, phone: form.phone, email: form.email, dob: form.dob, address: form.address },
        { name: "Nome", cpf: "CPF", phone: "Telefone", email: "E-mail", dob: "Nascimento", address: "Endereço" }
      );
      record(user.name, user.role, "EDITOU", "Paciente", selected.name, detail);
    }
    setModal(null);
  };

  const handleDelete = (p: Patient) => {
    if (appointments.some((a) => a.patientId === p.id)) { setDeleteAlert(p); return; }
    record(user.name, user.role, "EXCLUIU", "Paciente", p.name, `CPF: ${p.cpf}`);
    setList(list.filter((x) => x.id !== p.id));
  };

  const cls = (field: string) =>
    `w-full px-3.5 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${errors[field] ? "border-red-300 bg-red-50" : "border-slate-200"}`;

  return (
    <div className="px-4 py-5 md:px-8 md:py-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-800" style={{ fontFamily: "Outfit, sans-serif" }}>Pacientes</h1>
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
          placeholder="Buscar por nome, CPF ou código..."
          className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        />
      </div>

      <div className="space-y-2.5 md:grid md:grid-cols-2 md:gap-3 lg:grid-cols-3 md:space-y-0">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">Nenhum paciente encontrado</div>
        ) : filtered.map((p) => (
          <div key={p.id} className="bg-white border border-slate-100 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 font-semibold flex-shrink-0">
                {p.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800">{p.name}</p>
                <p className="text-xs text-slate-400 mt-0.5">{p.cpf}</p>
                <p className="text-xs text-slate-400">{p.phone}</p>
              </div>
              <span className="text-[10px] text-slate-300 font-mono">#{p.id}</span>
            </div>
            <div className="flex gap-2 mt-3 pt-3 border-t border-slate-50">
              <button onClick={() => openView(p)} className="flex-1 text-xs font-medium text-emerald-600 bg-emerald-50 active:bg-emerald-100 py-1.5 rounded-lg hover:brightness-95 transition-colors">Ver</button>
              {user.role !== "doctor" && (
                <>
                  <button onClick={() => openEdit(p)} className="flex-1 text-xs font-medium text-slate-600 bg-slate-50 active:bg-slate-100 py-1.5 rounded-lg hover:brightness-95 transition-colors">Editar</button>
                  <button onClick={() => handleDelete(p)} className="flex-1 text-xs font-medium text-rose-500 bg-rose-50 active:bg-rose-100 py-1.5 rounded-lg hover:brightness-95 transition-colors">Excluir</button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {(modal === "add" || modal === "edit") && (
        <Modal title={modal === "add" ? "Novo Paciente" : "Editar Paciente"} onClose={() => setModal(null)}>
          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Nome completo *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={cls("name")} />
              {errors.name && <p className="text-xs text-red-500 mt-0.5">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">CPF *</label>
              <input
                value={form.cpf}
                onChange={(e) => setForm({ ...form, cpf: maskCPF(e.target.value) })}
                placeholder="000.000.000-00"
                maxLength={14}
                className={cls("cpf")}
              />
              {errors.cpf && <p className="text-xs text-red-500 mt-0.5">{errors.cpf}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Data de nascimento *</label>
              <input type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })}
                className={cls("dob")} />
              {errors.dob && <p className="text-xs text-red-500 mt-0.5">{errors.dob}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Telefone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: maskPhone(e.target.value) })}
                placeholder="(00) 00000-0000"
                maxLength={15}
                className={cls("phone")}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">E-mail</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={cls("email")} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Endereço</label>
              <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                className={cls("address")} />
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <button onClick={() => setModal(null)} className="flex-1 py-3 text-sm font-medium text-emerald-700 border border-emerald-200 hover:bg-emerald-50 rounded-full transition-colors hover:bg-slate-50">Cancelar</button>
            <button onClick={handleSave} className="flex-1 py-3 text-sm font-semibold text-white bg-emerald-600 rounded-full shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all hover:bg-emerald-700">Salvar</button>
          </div>
        </Modal>
      )}

      {modal === "view" && selected && (
        <Modal title="Dados do Paciente" onClose={() => setModal(null)}>
          <div className="space-y-3">
            {[["Código", `#${selected.id}`], ["Nome", selected.name], ["CPF", selected.cpf], ["Nascimento", new Date(selected.dob + "T12:00:00").toLocaleDateString("pt-BR")], ["Telefone", selected.phone || "—"], ["E-mail", selected.email || "—"], ["Endereço", selected.address || "—"]].map(([l, v]) => (
              <div key={l} className="flex justify-between py-2 border-b border-slate-50 last:border-0">
                <span className="text-xs text-slate-400">{l}</span>
                <span className="text-sm text-slate-700 font-medium text-right">{v}</span>
              </div>
            ))}
          </div>
          <button onClick={() => setModal(null)} className="w-full mt-5 py-3 text-sm font-semibold text-white bg-emerald-600 rounded-full shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all">Fechar</button>
        </Modal>
      )}

      {deleteAlert && (
        <Modal title="Não é possível excluir" onClose={() => setDeleteAlert(null)}>
          <p className="text-sm text-slate-600">{deleteAlert.name} possui consultas vinculadas e não pode ser excluído.</p>
          <button onClick={() => setDeleteAlert(null)} className="w-full mt-5 py-3 text-sm font-semibold text-white bg-emerald-600 rounded-full shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all">Entendido</button>
        </Modal>
      )}
    </div>
  );
}
