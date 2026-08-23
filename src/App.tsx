import { useState } from "react";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import AttendantDashboard from "./pages/AttendantDashboard";
import DoctorDashboard from "./pages/DoctorDashboard";
import PatientDashboard from "./pages/PatientDashboard";
import PatientsPage from "./pages/PatientsPage";
import DoctorsPage from "./pages/DoctorsPage";
import AppointmentsPage from "./pages/AppointmentsPage";
import ExamsPage from "./pages/ExamsPage";
import UsersPage from "./pages/UsersPage";
import ProntuarioPage from "./pages/ProntuarioPage";
import ChangePasswordPage from "./pages/ChangePasswordPage";
import Layout from "./components/Layout";
import { useData } from "./context/DataContext";

export type UserRole = "admin" | "attendant" | "doctor" | "patient";
export type Page =
  | "dashboard"
  | "patients"
  | "doctors"
  | "appointments"
  | "exams"
  | "users"
  | "prontuario";

export interface AuthUser {
  name: string;
  role: UserRole;
  email: string;
  mustChangePassword?: boolean;
  patientId?: number;
}

export default function App() {
  const { sysUsers, loading, syncError } = useData();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [page, setPage] = useState<Page>("dashboard");

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-400">Carregando dados do servidor...</p>
      </div>
    );
  }

  if (!user) {
    return <Login sysUsers={sysUsers} onLogin={(u) => { setUser(u); setPage("dashboard"); }} />;
  }

  if (user.mustChangePassword) {
    return (
      <ChangePasswordPage
        user={user}
        onPasswordChanged={() => setUser({ ...user, mustChangePassword: false })}
      />
    );
  }

  const renderPage = () => {
    switch (page) {
      case "dashboard":
        if (user.role === "admin") return <AdminDashboard />;
        if (user.role === "attendant") return <AttendantDashboard onNavigate={setPage} />;
        if (user.role === "doctor") return <DoctorDashboard />;
        return <PatientDashboard user={user} />;
      case "patients": return <PatientsPage user={user} />;
      case "doctors": return <DoctorsPage user={user} />;
      case "appointments": return <AppointmentsPage user={user} />;
      case "exams": return <ExamsPage user={user} />;
      case "users": return <UsersPage user={user} />;
      case "prontuario": return <ProntuarioPage user={user} />;
      default: return null;
    }
  };

  return (
    <Layout
      user={user}
      page={page}
      onNavigate={setPage}
      onLogout={() => setUser(null)}
    >
      {syncError && (
        <div className="bg-amber-50 border-b border-amber-100 px-4 py-2 text-xs text-amber-700 text-center">
          {syncError}
        </div>
      )}
      {renderPage()}
    </Layout>
  );
}
