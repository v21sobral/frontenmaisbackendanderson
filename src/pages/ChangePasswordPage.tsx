import { useState } from "react";
import { useData } from "../context/DataContext";
import type { AuthUser } from "../App";

interface Props {
  user: AuthUser;
  onChanged: (updated: AuthUser) => void;
}

export default function ChangePasswordPage({ user, onChanged }: Props) {
  const { sysUsers, setSysUsers } = useData();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (password.length < 6) { setError("A senha deve ter pelo menos 6 caracteres."); return; }
    if (password !== confirm) { setError("As senhas não coincidem."); return; }

    const target = sysUsers.find((u) => u.email.toLowerCase() === user.email.toLowerCase());
    if (!target) { setError("Usuário não encontrado."); return; }

    setSysUsers(sysUsers.map((u) =>
      u.id === target.id ? { ...u, password, mustChangePassword: false } : u
    ));
    onChanged({ ...user, mustChangePassword: false });
  };

  return (
    <div className="min-h-[100dvh] bg-slate-100 flex flex-col md:items-center md:justify-center px-6 py-10">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h1 className="text-lg font-semibold text-slate-800 mb-1" style={{ fontFamily: "Outfit, sans-serif" }}>
          Defina sua nova senha
        </h1>
        <p className="text-sm text-slate-500 mb-6">
          Este é seu primeiro acesso. Por segurança, defina uma senha antes de continuar.
        </p>

        <label className="text-xs font-medium text-slate-500 mb-1 block">Nova senha</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm mb-4 outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
          placeholder="Mínimo 6 caracteres"
        />

        <label className="text-xs font-medium text-slate-500 mb-1 block">Confirmar nova senha</label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm mb-2 outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
          placeholder="Repita a senha"
        />

        {error && <p className="text-xs text-rose-600 mb-3">{error}</p>}

        <button
          onClick={handleSubmit}
          className="w-full mt-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-semibold py-2.5 rounded-full shadow-md hover:shadow-lg transition-all"
        >
          Salvar e continuar
        </button>
      </div>
    </div>
  );
}
