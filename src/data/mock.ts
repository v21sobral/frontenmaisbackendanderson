export interface Patient {
  id: number;
  name: string;
  cpf: string;
  phone: string;
  email: string;
  dob: string;
  address: string;
}

export interface Doctor {
  id: number;
  name: string;
  crm: string;
  specialty: string;
  phone: string;
  email: string;
}

export interface Appointment {
  id: number;
  patientId: number;
  doctorId: number;
  date: string;
  time: string;
  status: "AGENDADA" | "REALIZADA" | "CANCELADA";
  reason: string;
  notes: string;
  scheduledBy?: string;
}

export interface SysUser {
  id: number;
  name: string;
  email: string;
  role: string;
  active: boolean;
  password: string;
  patientId?: number;
  mustChangePassword?: boolean;
}

export interface Exam {
  id: number;
  name: string;
  type: string;
  patientId: number;
  doctorId: number;
  appointmentId?: number;
  requestDate: string;
  realizationDate?: string;
  result?: string;
  notes?: string;
  status: "SOLICITADO" | "AGENDADO" | "REALIZADO" | "CANCELADO";
  scheduledBy?: string;
}

export const patients: Patient[] = [
  { id: 1, name: "Beatriz Costa", cpf: "123.456.789-00", phone: "(11) 98765-4321", email: "beatriz@email.com", dob: "1990-05-12", address: "Rua das Flores, 123 - SP" },
  { id: 2, name: "João Pereira", cpf: "987.654.321-00", phone: "(11) 91234-5678", email: "joao@email.com", dob: "1985-08-20", address: "Av. Paulista, 456 - SP" },
  { id: 3, name: "Maria Oliveira", cpf: "456.789.123-00", phone: "(21) 99876-5432", email: "maria@email.com", dob: "1978-03-15", address: "Rua do Mar, 78 - RJ" },
  { id: 4, name: "Pedro Alves", cpf: "321.654.987-00", phone: "(31) 98654-1230", email: "pedro@email.com", dob: "1995-11-30", address: "Av. Afonso Pena, 900 - BH" },
  { id: 5, name: "Carla Santos", cpf: "654.321.098-00", phone: "(11) 97543-2109", email: "carla@email.com", dob: "2001-07-08", address: "Rua Augusta, 250 - SP" },
];

export const doctors: Doctor[] = [
  { id: 1, name: "Dr. Rafael Mendes", crm: "CRM-SP 12345", specialty: "Clínica Geral", phone: "(11) 3456-7890", email: "medico@vidamaissaude.com" },
  { id: 2, name: "Dra. Fernanda Lima", crm: "CRM-SP 67890", specialty: "Cardiologia", phone: "(11) 3456-7891", email: "fernanda@vidamaissaude.com" },
  { id: 3, name: "Dr. Lucas Rocha", crm: "CRM-RJ 11223", specialty: "Ortopedia", phone: "(21) 3210-9876", email: "lucas@vidamaissaude.com" },
  { id: 4, name: "Dra. Paula Gomes", crm: "CRM-MG 44556", specialty: "Pediatria", phone: "(31) 2109-8765", email: "paula@vidamaissaude.com" },
];

export const appointments: Appointment[] = [
  { id: 1, patientId: 1, doctorId: 1, date: "2026-08-20", time: "09:00", status: "AGENDADA", reason: "Consulta de rotina", notes: "", scheduledBy: "Carlos Lima" },
  { id: 2, patientId: 2, doctorId: 2, date: "2026-08-20", time: "10:30", status: "AGENDADA", reason: "Dor no peito", notes: "Paciente hipertenso", scheduledBy: "Carlos Lima" },
  { id: 3, patientId: 3, doctorId: 1, date: "2026-08-19", time: "14:00", status: "REALIZADA", reason: "Retorno", notes: "Exames solicitados", scheduledBy: "Maria Auxiliadora" },
  { id: 4, patientId: 4, doctorId: 3, date: "2026-08-18", time: "11:00", status: "CANCELADA", reason: "Dor no joelho", notes: "", scheduledBy: "Carlos Lima" },
  { id: 5, patientId: 5, doctorId: 4, date: "2026-08-21", time: "08:30", status: "AGENDADA", reason: "Consulta pediátrica", notes: "", scheduledBy: "Maria Auxiliadora" },
  { id: 6, patientId: 1, doctorId: 2, date: "2026-08-22", time: "15:00", status: "AGENDADA", reason: "Check-up cardíaco", notes: "", scheduledBy: "Carlos Lima" },
];

export const exams: Exam[] = [
  { id: 1, name: "Hemograma Completo", type: "Laboratorial", patientId: 3, doctorId: 1, appointmentId: 3, requestDate: "2026-08-19", realizationDate: "2026-08-20", result: "Normal", notes: "", status: "REALIZADO", scheduledBy: "Carlos Lima" },
  { id: 2, name: "Eletrocardiograma", type: "Cardiológico", patientId: 2, doctorId: 2, appointmentId: 2, requestDate: "2026-08-20", status: "SOLICITADO", scheduledBy: "Carlos Lima" },
  { id: 3, name: "Raio-X Joelho Direito", type: "Imagem", patientId: 4, doctorId: 3, requestDate: "2026-08-18", status: "AGENDADO", notes: "Agendar para próxima semana", scheduledBy: "Maria Auxiliadora" },
  { id: 4, name: "Glicemia em Jejum", type: "Laboratorial", patientId: 1, doctorId: 1, requestDate: "2026-08-20", status: "SOLICITADO", scheduledBy: "Carlos Lima" },
];

export const sysUsers: SysUser[] = [
  { id: 1, name: "Ana Souza", email: "admin@vidamaissaude.com", role: "admin", active: true, password: "admin123" },
  { id: 2, name: "Carlos Lima", email: "atendente@vidamaissaude.com", role: "attendant", active: true, password: "atend123" },
  { id: 3, name: "Dr. Rafael Mendes", email: "medico@vidamaissaude.com", role: "doctor", active: true, password: "medico123" },
  { id: 4, name: "Dra. Fernanda Lima", email: "fernanda@vidamaissaude.com", role: "doctor", active: true, password: "fernanda123" },
  { id: 5, name: "Maria Auxiliadora", email: "maria.aux@vidamaissaude.com", role: "attendant", active: false, password: "maria123" },
  { id: 6, name: "Beatriz Costa", email: "paciente@vidamaissaude.com", role: "patient", active: true, password: "pac123", patientId: 1, mustChangePassword: false },
];
