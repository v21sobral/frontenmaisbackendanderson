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
import AuditPage from "./pages/AuditPage";
import ChangePasswordPage from "./pages/ChangePasswordPage";
import Layout from "./components/Layout";
import { AuditProvider } from "./context/AuditContext";
import { DataProvider, useData } from "./context/DataContext";

export type UserRole = "admin" | "attendant" | "doctor" | "patient";
export type Page =
  | "dashboard"
  | "patients"
  | "doctors"
  | "appointments"
  | "exams"
  | "users"
  | "prontuario"
  | "audit";

export interface AuthUser {
  name: string;
  role: UserRole;
  email: string;
  patientId?: number;
  doctorId?: number;
  mustChangePassword?: boolean;
}

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [page, setPage] = useState<Page>("dashboard");
  const { loading, saving, syncError } = useData();

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">
            Conectando ao servidor... (pode levar até 30s se estiver "dormindo")
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={(u) => { setUser(u); setPage("dashboard"); }} />;
  }

  if (user.mustChangePassword) {
    return (
      <ChangePasswordPage
        user={user}
        onChanged={(updated) => setUser(updated)}
      />
    );
  }

  const renderPage = () => {
    switch (page) {
      case "dashboard":
        if (user.role === "admin") return <AdminDashboard />;
        if (user.role === "attendant") return <AttendantDashboard onNavigate={setPage} />;
        if (user.role === "doctor") return <DoctorDashboard user={user} />;
        return <PatientDashboard user={user} />;
      case "patients": return <PatientsPage user={user} />;
      case "doctors": return <DoctorsPage user={user} />;
      case "appointments": return <AppointmentsPage user={user} />;
      case "exams": return <ExamsPage user={user} />;
      case "users": return <UsersPage user={user} />;
      case "prontuario": return <ProntuarioPage user={user} />;
      case "audit":
        if (user.role !== "admin") return null;
        return <AuditPage />;
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
        <div className="bg-amber-50 border-b border-amber-200 text-amber-700 text-xs px-4 py-2 text-center">
          {syncError}
        </div>
      )}
      {saving && !syncError && (
        <div className="fixed bottom-4 right-4 z-50 bg-slate-800 text-white text-xs px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
          Salvando...
        </div>
      )}
      {renderPage()}
    </Layout>
  );
}
