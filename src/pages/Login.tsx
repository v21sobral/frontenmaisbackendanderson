import { useState } from "react";
import type { AuthUser } from "../App";
import type { SysUser } from "../data/mock";

interface Props { sysUsers: SysUser[]; onLogin: (user: AuthUser) => void; }

export default function Login({ sysUsers, onLogin }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showContact, setShowContact] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalEmail = email.trim().toLowerCase();
    const match = sysUsers.find((u) => u.email.toLowerCase() === normalEmail);
    if (match && match.password === password.trim()) {
      if (!match.active) {
        setError("Usuário inativo. Fale com o administrador.");
        return;
      }
      onLogin({ name: match.name, email: match.email, role: match.role as AuthUser["role"], mustChangePassword: match.mustChangePassword ?? false, patientId: match.patientId });
    } else {
      setError("E-mail ou senha inválidos.");
    }
  };

  return (
    <div className="min-h-[100dvh] bg-slate-200 flex flex-col md:items-center md:justify-center" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="w-full max-w-md mx-auto md:rounded-3xl md:overflow-hidden md:shadow-2xl flex flex-col flex-1 md:flex-none">
        {/* Top hero */}
        <div className="bg-emerald-600 px-6 pt-14 pb-10 md:pt-10 md:pb-8">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <span className="text-white text-sm font-bold tracking-tight" style={{ fontFamily: "Outfit, sans-serif" }}>V+S</span>
            </div>
            <span className="text-white text-xl font-semibold" style={{ fontFamily: "Outfit, sans-serif" }}>Vida + Saúde</span>
          </div>
          <h1 className="text-white text-2xl font-bold leading-tight" style={{ fontFamily: "Outfit, sans-serif" }}>
            Gestão de consultas<br />simples e eficiente.
          </h1>
          <p className="text-emerald-200 text-sm mt-2">Agendamentos e exames na palma da mão.</p>
        </div>

        {/* Form card */}
        <div className="flex-1 bg-white rounded-t-3xl -mt-4 px-6 pt-7 pb-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-5" style={{ fontFamily: "Outfit, sans-serif" }}>Entrar na conta</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                placeholder="seu@email.com"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            {error && (
              <p className="text-red-500 text-xs bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">{error}</p>
            )}
            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold py-3.5 rounded-full text-sm transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 mt-1"
            >
              Entrar
            </button>
          </form>

          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={() => setShowContact((v) => !v)}
              className="text-xs text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              Esqueceu a senha? Fale com o administrador
            </button>
            {showContact && (
              <div className="mt-3 bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3 text-left">
                <p className="text-xs font-semibold text-emerald-800 mb-1">Redefinição de senha</p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Entre em contato com o administrador do sistema para solicitar a redefinição da sua senha:
                </p>
                <a
                  href="mailto:admin@vidamaissaude.com"
                  className="inline-block mt-2 text-xs font-medium text-emerald-700 underline underline-offset-2"
                >
                  admin@vidamaissaude.com
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
