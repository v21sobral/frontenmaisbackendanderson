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
import Layout from "./components/Layout";
import { AuditProvider } from "./context/AuditContext";
import { DataProvider } from "./context/DataContext";

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
}

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [page, setPage] = useState<Page>("dashboard");

  if (!user) {
    return <Login onLogin={(u) => { setUser(u); setPage("dashboard"); }} />;
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
      {renderPage()}
    </Layout>
  );
}
