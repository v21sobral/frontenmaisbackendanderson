import { useState } from "react";
import Modal from "../components/Modal";
import { useAudit } from "../context/AuditContext";
import { useData, type SysUser } from "../context/DataContext";
import type { AuthUser } from "../App";

type Role = "admin" | "attendant" | "doctor" | "patient";

const ROLE_LABELS: Record<Role, string> = { admin: "Administrador", attendant: "Atendente", doctor: "Médico", patient: "Paciente" };
const ROLE_COLORS: Record<Role, string> = {
  admin: "bg-violet-50 text-violet-700 border-violet-100",
  attendant: "bg-sky-50 text-sky-700 border-sky-100",
  doctor: "bg-teal-50 text-teal-700 border-teal-100",
  patient: "bg-emerald-50 text-emerald-700 border-emerald-100",
};

const emptyForm = { name: "", email: "", role: "attendant" as Role, active: true, password: "" };

interface Props { user: AuthUser; }

export default function UsersPage({ user }: Props) {
  const { record } = useAudit();
  const { sysUsers: list, setSysUsers: setList } = useData();
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [selected, setSelected] = useState<SysUser | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filtered = list.filter(
    (u) => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Nome obrigatório";
    if (!form.email.trim()) e.email = "E-mail obrigatório";
    else {
      const dup = list.find((u) => u.email.toLowerCase() === form.email.trim().toLowerCase() && u.id !== selected?.id);
      if (dup) e.email = `E-mail já cadastrado para ${dup.name}`;
    }
    if (modal === "add" && !form.password.trim()) e.password = "Senha obrigatória";
    return e;
  };

  const openAdd = () => { setForm({ ...emptyForm }); setErrors({}); setSelected(null); setModal("add"); };
  const openEdit = (u: SysUser) => { setSelected(u); setForm({ name: u.name, email: u.email, role: u.role, active: u.active, password: "" }); setErrors({}); setModal("edit"); };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    if (modal === "add") {
      setList([...list, { name: form.name, email: form.email, role: form.role, active: form.active, password: form.password, id: list.length ? Math.max(...list.map((u) => u.id)) + 1 : 1 }]);
      record(user.name, user.role, "CRIOU", "Usuário", form.name, ROLE_LABELS[form.role]);
    } else if (selected) {
      const updated = { name: form.name, email: form.email, role: form.role, active: form.active, ...(form.password.trim() ? { password: form.password } : {}) };
      setList(list.map((u) => u.id === selected.id ? { ...u, ...updated } : u));
      const detail = [
        selected.name !== form.name ? `Nome: "${selected.name}" → "${form.name}"` : "",
        selected.email !== form.email ? `E-mail: "${selected.email}" → "${form.email}"` : "",
        selected.role !== form.role ? `Perfil: "${ROLE_LABELS[selected.role]}" → "${ROLE_LABELS[form.role]}"` : "",
        selected.active !== form.active ? `Status: "${selected.active ? "Ativo" : "Inativo"}" → "${form.active ? "Ativo" : "Inativo"}"` : "",
      ].filter(Boolean).join("; ") || "Nenhum dado alterado";
      record(user.name, user.role, "EDITOU", "Usuário", selected.name, detail);
    }
    setModal(null);
  };

  const toggleActive = (u: SysUser) => {
    setList(list.map((x) => x.id === u.id ? { ...x, active: !x.active } : x));
    record(user.name, user.role, "EDITOU", "Usuário", u.name, u.active ? "Desativado" : "Ativado");
  };

  return (
    <div className="px-4 py-5 md:px-8 md:py-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-800" style={{ fontFamily: "Outfit, sans-serif" }}>Usuários</h1>
          <p className="text-xs text-slate-400 mt-0.5">{list.filter((u) => u.active).length} ativos de {list.length}</p>
        </div>
        <button onClick={openAdd} className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-semibold px-5 py-2 rounded-full shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all">
          + Novo
        </button>
      </div>

      <div className="mb-4">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar usuário..."
          className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
      </div>

      <div className="space-y-2.5 md:grid md:grid-cols-2 md:gap-3 lg:grid-cols-3 md:space-y-0">
        {filtered.map((u) => (
          <div key={u.id} className="bg-white border border-slate-100 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 font-semibold flex-shrink-0">
                {u.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{u.name}</p>
                <p className="text-xs text-slate-400 truncate">{u.email}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${ROLE_COLORS[u.role]}`}>
                  {ROLE_LABELS[u.role]}
                </span>
                <button
                  onClick={() => toggleActive(u)}
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-colors ${u.active ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-slate-100 text-slate-400 border-slate-200"}`}
                >
                  {u.active ? "Ativo" : "Inativo"}
                </button>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-50">
              <button onClick={() => openEdit(u)} className="w-full text-xs font-medium text-slate-600 bg-slate-50 active:bg-slate-100 py-1.5 rounded-lg hover:brightness-95 transition-colors">Editar</button>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <Modal title={modal === "add" ? "Novo Usuário" : "Editar Usuário"} onClose={() => setModal(null)}>
          <div className="space-y-3.5">
            {(["name", "email", ...(modal === "add" ? ["password"] : [])] as const).map((id: any) => {
              const config: Record<string, { label: string; type: string }> = {
                name: { label: "Nome completo *", type: "text" },
                email: { label: "E-mail *", type: "email" },
                password: { label: "Senha *", type: "password" },
              };
              const { label, type } = config[id];
              return (
                <div key={id}>
                  <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
                  <input
                    type={type}
                    value={(form as any)[id]}
                    onChange={(e) => setForm({ ...form, [id]: e.target.value })}
                    className={`w-full px-3.5 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${(errors as any)[id] ? "border-red-300" : "border-slate-200"}`}
                  />
                  {(errors as any)[id] && <p className="text-xs text-red-500 mt-0.5">{(errors as any)[id]}</p>}
                </div>
              );
            })}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Perfil</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500">
                {(Object.entries(ROLE_LABELS) as [Role, string][]).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4" />
              <span className="text-sm text-slate-600">Usuário ativo</span>
            </label>
          </div>
          <div className="flex gap-3 mt-5">
            <button onClick={() => setModal(null)} className="flex-1 py-3 text-sm font-medium text-emerald-700 border border-emerald-200 hover:bg-emerald-50 rounded-full transition-colors">Cancelar</button>
            <button onClick={handleSave} className="flex-1 py-3 text-sm font-semibold text-white bg-emerald-600 rounded-full shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all">Salvar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
