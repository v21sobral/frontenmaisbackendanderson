import { createContext, useContext, useEffect, useRef, useState } from "react";
import {
  patients as initPatients,
  doctors as initDoctors,
  appointments as initAppointments,
  exams as initExams,
  sysUsers as initUsers,
  type Patient,
  type Doctor,
  type Appointment,
  type Exam,
  type SysUser,
} from "../data/mock";

export type { SysUser };

export interface Prontuario {
  id: number;
  patientId: number;
  doctorId: number;
  date: string;
  title: string;
  content: string;
  appointmentId?: number;
}

interface DataContextValue {
  patients: Patient[];
  setPatients: React.Dispatch<React.SetStateAction<Patient[]>>;
  doctors: Doctor[];
  setDoctors: React.Dispatch<React.SetStateAction<Doctor[]>>;
  appointments: Appointment[];
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  exams: Exam[];
  setExams: React.Dispatch<React.SetStateAction<Exam[]>>;
  sysUsers: SysUser[];
  setSysUsers: React.Dispatch<React.SetStateAction<SysUser[]>>;
  prontuarios: Prontuario[];
  setProntuarios: React.Dispatch<React.SetStateAction<Prontuario[]>>;
  /** true enquanto os dados iniciais ainda estão sendo buscados do backend */
  loading: boolean;
  /** mensagem de erro de sincronização com o backend, se houver */
  syncError: string | null;
}

const DataContext = createContext<DataContextValue | null>(null);

const initProntuarios: Prontuario[] = [
  { id: 1, patientId: 1, doctorId: 1, date: "2026-08-19", title: "Consulta de rotina", content: "Paciente apresenta bom estado geral. PA 120/80 mmHg. Sem queixas relevantes. Solicitado hemograma de controle.", appointmentId: 3 },
];

// URL do backend. Configurada em .env / .env.local via VITE_API_URL.
// Se não estiver definida, o app roda 100% local (comportamento original,
// sem persistência), útil pra desenvolvimento sem precisar subir o servidor.
const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") || "";

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [patients, setPatients] = useState<Patient[]>(initPatients);
  const [doctors, setDoctors] = useState<Doctor[]>(initDoctors);
  const [appointments, setAppointments] = useState<Appointment[]>(initAppointments);
  const [exams, setExams] = useState<Exam[]>(initExams);
  const [sysUsers, setSysUsers] = useState<SysUser[]>(initUsers);
  const [prontuarios, setProntuarios] = useState<Prontuario[]>(initProntuarios);

  const [loading, setLoading] = useState(!!API_URL);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Evita que o efeito de "salvar" dispare antes do carregamento inicial
  // (o que sobrescreveria os dados do servidor com os dados mockados).
  const hasLoaded = useRef(!API_URL);

  // Busca o estado salvo no backend assim que o app monta.
  useEffect(() => {
    if (!API_URL) return;
    let cancelled = false;

    fetch(`${API_URL}/api/data`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((remote) => {
        if (cancelled) return;
        if (remote.patients) setPatients(remote.patients);
        if (remote.doctors) setDoctors(remote.doctors);
        if (remote.appointments) setAppointments(remote.appointments);
        if (remote.exams) setExams(remote.exams);
        if (remote.sysUsers) setSysUsers(remote.sysUsers);
        if (remote.prontuarios) setProntuarios(remote.prontuarios);
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("Falha ao carregar dados do backend:", err);
          setSyncError("Não foi possível carregar os dados do servidor. Usando dados locais de exemplo.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          hasLoaded.current = true;
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sempre que os dados mudam (depois do carregamento inicial), salva no
  // backend com um pequeno debounce para não disparar uma requisição por tecla.
  useEffect(() => {
    if (!API_URL || !hasLoaded.current) return;

    const timeout = setTimeout(() => {
      fetch(`${API_URL}/api/data`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patients, doctors, appointments, exams, sysUsers, prontuarios }),
      })
        .then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          setSyncError(null);
        })
        .catch((err) => {
          console.error("Falha ao salvar dados no backend:", err);
          setSyncError("Não foi possível salvar as alterações no servidor.");
        });
    }, 400);

    return () => clearTimeout(timeout);
  }, [patients, doctors, appointments, exams, sysUsers, prontuarios]);

  return (
    <DataContext.Provider
      value={{
        patients, setPatients,
        doctors, setDoctors,
        appointments, setAppointments,
        exams, setExams,
        sysUsers, setSysUsers,
        prontuarios, setProntuarios,
        loading, syncError,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used inside DataProvider");
  return ctx;
}
