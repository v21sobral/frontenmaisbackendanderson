import { createContext, useContext, useState } from "react";
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
}

const DataContext = createContext<DataContextValue | null>(null);

const initProntuarios: Prontuario[] = [
  { id: 1, patientId: 1, doctorId: 1, date: "2026-08-19", title: "Consulta de rotina", content: "Paciente apresenta bom estado geral. PA 120/80 mmHg. Sem queixas relevantes. Solicitado hemograma de controle.", appointmentId: 3 },
];

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [patients, setPatients] = useState<Patient[]>(initPatients);
  const [doctors, setDoctors] = useState<Doctor[]>(initDoctors);
  const [appointments, setAppointments] = useState<Appointment[]>(initAppointments);
  const [exams, setExams] = useState<Exam[]>(initExams);
  const [sysUsers, setSysUsers] = useState<SysUser[]>(initUsers);
  const [prontuarios, setProntuarios] = useState<Prontuario[]>(initProntuarios);

  return (
    <DataContext.Provider value={{ patients, setPatients, doctors, setDoctors, appointments, setAppointments, exams, setExams, sysUsers, setSysUsers, prontuarios, setProntuarios }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used inside DataProvider");
  return ctx;
}
