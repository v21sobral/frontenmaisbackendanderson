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

export interface Prontuario {
  id: number;
  patientId: number;
  doctorId: number;
  date: string;
  title: string;
  content: string;
  appointmentId?: number;
}

export type { SysUser };

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
  /** true enquanto o estado inicial ainda está sendo buscado do backend */
  loading: boolean;
  /** mensagem de erro, se a busca/gravação no backend falhar (null = tudo certo) */
  syncError: string | null;
}

const DataContext = createContext<DataContextValue | null>(null);

const initProntuarios: Prontuario[] = [
  { id: 1, patientId: 1, doctorId: 1, date: "2026-08-19", title: "Consulta de rotina", content: "Paciente apresenta bom estado geral. PA 120/80 mmHg. Sem queixas relevantes. Solicitado hemograma de controle.", appointmentId: 3 },
];

// Se VITE_API_URL não estiver definido, o app roda 100% em memória (sem
// persistência), igual a antes — útil para rodar o front sozinho, sem backend.
const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "");

interface ApiState {
  patients: Patient[];
  doctors: Doctor[];
  appointments: Appointment[];
  exams: Exam[];
  sysUsers: SysUser[];
  prontuarios: Prontuario[];
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [patients, setPatients] = useState<Patient[]>(initPatients);
  const [doctors, setDoctors] = useState<Doctor[]>(initDoctors);
  const [appointments, setAppointments] = useState<Appointment[]>(initAppointments);
  const [exams, setExams] = useState<Exam[]>(initExams);
  const [sysUsers, setSysUsers] = useState<SysUser[]>(initUsers);
  const [prontuarios, setProntuarios] = useState<Prontuario[]>(initProntuarios);

  // Sem backend configurado: não há nada para buscar, então não fica "carregando".
  const [loading, setLoading] = useState(Boolean(API_URL));
  const [syncError, setSyncError] = useState<string | null>(null);

  // Evita que o efeito de salvar (PUT) dispare por causa dos dados que
  // acabaram de chegar do GET inicial — só passa a "true" depois do 1º load.
  const hasLoadedRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 1) Busca o estado salvo no backend assim que o app abre.
  useEffect(() => {
    if (!API_URL) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/data`);
        if (!res.ok) throw new Error(`Backend respondeu ${res.status}`);
        const data: ApiState = await res.json();
        if (cancelled) return;
        setPatients(data.patients ?? []);
        setDoctors(data.doctors ?? []);
        setAppointments(data.appointments ?? []);
        setExams(data.exams ?? []);
        setSysUsers(data.sysUsers ?? []);
        setProntuarios(data.prontuarios ?? []);
        setSyncError(null);
      } catch (err) {
        if (cancelled) return;
        console.error("Falha ao carregar dados do backend:", err);
        setSyncError("Não foi possível conectar ao servidor. Os dados desta sessão não serão salvos.");
      } finally {
        if (!cancelled) {
          hasLoadedRef.current = true;
          setLoading(false);
        }
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2) Sempre que qualquer parte do estado mudar, reenvia tudo pro backend
  // (com um pequeno debounce, pra não disparar uma requisição por tecla).
  useEffect(() => {
    if (!API_URL) return;
    if (!hasLoadedRef.current) return; // ainda não terminou o GET inicial

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API_URL}/api/data`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ patients, doctors, appointments, exams, sysUsers, prontuarios }),
        });
        if (!res.ok) throw new Error(`Backend respondeu ${res.status}`);
        setSyncError(null);
      } catch (err) {
        console.error("Falha ao salvar dados no backend:", err);
        setSyncError("Não foi possível salvar as últimas alterações no servidor.");
      }
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
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
