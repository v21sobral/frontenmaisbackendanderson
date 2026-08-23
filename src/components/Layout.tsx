import type { AuthUser, Page, UserRole } from "../App";

interface NavItem { id: Page; label: string; icon: React.ReactNode; roles: UserRole[]; }

const NavIcon = ({ d }: { d: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Início", icon: <NavIcon d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />, roles: ["admin", "attendant", "doctor", "patient"] },
  { id: "patients", label: "Pacientes", icon: <NavIcon d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />, roles: ["admin", "attendant", "doctor"] },
  { id: "appointments", label: "Consultas", icon: <NavIcon d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" />, roles: ["admin", "attendant", "doctor", "patient"] },
  { id: "exams", label: "Exames", icon: <NavIcon d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M12 12v4M10 14h4" />, roles: ["admin", "attendant", "doctor", "patient"] },
  { id: "doctors", label: "Médicos", icon: <NavIcon d="M4.5 12.5a8 8 0 1015 0 8 8 0 00-15 0zM12 8v4l3 2" />, roles: ["admin", "attendant"] },
  { id: "users", label: "Usuários", icon: <NavIcon d="M12 4a4 4 0 100 8 4 4 0 000-8zM6 20v-1a6 6 0 0112 0v1" />, roles: ["admin"] },
  { id: "prontuario", label: "Prontuário", icon: <NavIcon d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M12 12h4M12 16h4M8 12h.01M8 16h.01" />, roles: ["doctor", "patient"] },
];

const ROLE_LABELS: Record<string, string> = { admin: "Administrador", attendant: "Atendente", doctor: "Médico", patient: "Paciente" };
const LogoutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
  </svg>
);

interface Props { user: AuthUser; page: Page; onNavigate: (p: Page) => void; onLogout: () => void; children: React.ReactNode; }

export default function Layout({ user, page, onNavigate, onLogout, children }: Props) {
  const visible = NAV_ITEMS.filter((n) => n.roles.includes(user.role));

  return (
    <div className="flex h-[100dvh] bg-slate-50" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── Sidebar (tablet + desktop) ── */}
      <aside className="hidden md:flex md:flex-col md:w-56 lg:w-64 bg-white border-r border-slate-100 flex-shrink-0">
        {/* Logo */}
        <div className="px-5 py-4 border-b border-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-[10px] font-bold tracking-tight leading-none" style={{ fontFamily: "Outfit, sans-serif" }}>V+S</span>
            </div>
            <span className="text-base font-semibold text-slate-800" style={{ fontFamily: "Outfit, sans-serif" }}>Vida + Saúde</span>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {visible.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                page === item.id
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              }`}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {item.label}
              {page === item.id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500" />}
            </button>
          ))}
        </nav>

        {/* User + logout */}
        <div className="px-3 py-4 border-t border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 font-semibold text-sm flex-shrink-0">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-700 truncate">{user.name.split(" ")[0]}</p>
              <p className="text-[10px] text-slate-400">{ROLE_LABELS[user.role]}</p>
            </div>
            <button onClick={onLogout} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors" title="Sair">
              <LogoutIcon />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main column ── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* Mobile-only top header */}
        <header className="md:hidden bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center">
              <span className="text-white text-[9px] font-bold tracking-tight leading-none" style={{ fontFamily: "Outfit, sans-serif" }}>V+S</span>
            </div>
            <span className="text-sm font-semibold text-slate-800" style={{ fontFamily: "Outfit, sans-serif" }}>Vida + Saúde</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-xs font-medium text-slate-700 leading-tight">{user.name.split(" ")[0]}</p>
              <p className="text-[10px] text-slate-400">{ROLE_LABELS[user.role]}</p>
            </div>
            <button onClick={onLogout} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors" title="Sair">
              <LogoutIcon />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto">
            {children}
          </div>
        </main>

        {/* Mobile-only bottom nav */}
        <nav className="md:hidden bg-white border-t border-slate-100 flex-shrink-0 safe-bottom">
          <div className={`flex ${visible.length > 5 ? "overflow-x-auto scrollbar-none" : ""}`}>
            {visible.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`${visible.length > 5 ? "flex-none min-w-[4rem]" : "flex-1"} flex flex-col items-center gap-0.5 py-2.5 px-1 transition-colors ${
                  page === item.id ? "text-emerald-600" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {item.icon}
                <span className="text-[10px] font-medium leading-tight">{item.label}</span>
                {page === item.id && <div className="w-1 h-1 rounded-full bg-emerald-500 mt-0.5" />}
              </button>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
