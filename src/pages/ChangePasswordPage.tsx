import { useState } from "react";
import type { AuthUser } from "../App";
import { useData } from "../context/DataContext";

interface Props {
  user: AuthUser;
  onPasswordChanged: () => void;
}

export default function ChangePasswordPage({ user, onPasswordChanged }: Props) {
  const { sysUsers, setSysUsers } = useData();
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{ newPassword?: string; confirm?: string }>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof errors = {};
    if (newPassword.length < 6) errs.newPassword = "A senha deve ter pelo menos 6 caracteres";
    if (newPassword !== confirm) errs.confirm = "As senhas não coincidem";
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSysUsers((prev) =>
      prev.map((u) =>
        u.email.toLowerCase() === user.email.toLowerCase()
          ? { ...u, password: newPassword, mustChangePassword: false }
          : u
      )
    );
    onPasswordChanged();
  };

  return (
    <div className="min-h-[100dvh] bg-slate-50 md:bg-emerald-700 flex flex-col md:items-center md:justify-center" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="w-full max-w-md mx-auto md:rounded-3xl md:overflow-hidden md:shadow-2xl flex flex-col flex-1 md:flex-none">
        {/* Header */}
        <div className="bg-emerald-600 px-6 pt-14 pb-10 md:pt-10 md:pb-8">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <span className="text-white text-sm font-bold tracking-tight" style={{ fontFamily: "Outfit, sans-serif" }}>V+S</span>
            </div>
            <span className="text-white text-xl font-semibold" style={{ fontFamily: "Outfit, sans-serif" }}>Vida + Saúde</span>
          </div>
          <h1 className="text-white text-2xl font-bold leading-tight" style={{ fontFamily: "Outfit, sans-serif" }}>
            Crie sua senha<br />de acesso
          </h1>
          <p className="text-emerald-200 text-sm mt-2">Olá, {user.name.split(" ")[0]}. Por segurança, defina uma senha pessoal antes de continuar.</p>
        </div>

        {/* Form */}
        <div className="flex-1 bg-white rounded-t-3xl -mt-4 px-6 pt-7 pb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Nova senha *</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setErrors({}); }}
                placeholder="Mínimo 6 caracteres"
                className={`w-full px-4 py-3 border rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${errors.newPassword ? "border-red-300 bg-red-50" : "border-slate-200"}`}
              />
              {errors.newPassword && <p className="text-xs text-red-500 mt-1">{errors.newPassword}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Confirmar nova senha *</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => { setConfirm(e.target.value); setErrors({}); }}
                placeholder="Repita a senha"
                className={`w-full px-4 py-3 border rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${errors.confirm ? "border-red-300 bg-red-50" : "border-slate-200"}`}
              />
              {errors.confirm && <p className="text-xs text-red-500 mt-1">{errors.confirm}</p>}
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
              <p className="text-xs text-amber-700">Esta é uma senha provisória fornecida pela clínica. Defina uma senha pessoal e segura.</p>
            </div>
            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold py-3.5 rounded-full text-sm transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 mt-1"
            >
              Definir senha e entrar
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
