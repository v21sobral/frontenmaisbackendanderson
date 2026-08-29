import pg from "pg";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SEED_PATH = path.join(__dirname, "data", "seed.json");

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL não definida. Configure essa variável de ambiente com a Internal Database URL do seu banco Postgres no Render."
  );
}

// Conexões locais (ex: "localhost") normalmente não usam/exigem SSL;
// o Postgres do Render exige. Isso cobre os dois casos automaticamente.
const useSSL = !process.env.DATABASE_URL.includes("localhost");

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSSL ? { rejectUnauthorized: false } : false,
});

const CREATE_TABLES_SQL = `
  CREATE TABLE IF NOT EXISTS patients (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    cpf TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    dob TEXT,
    address TEXT
  );

  CREATE TABLE IF NOT EXISTS doctors (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    crm TEXT NOT NULL,
    specialty TEXT,
    phone TEXT,
    email TEXT
  );

  CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY,
    patient_id INTEGER,
    doctor_id INTEGER,
    date TEXT,
    time TEXT,
    status TEXT,
    reason TEXT,
    notes TEXT,
    scheduled_by TEXT
  );

  CREATE TABLE IF NOT EXISTS exams (
    id INTEGER PRIMARY KEY,
    name TEXT,
    type TEXT,
    patient_id INTEGER,
    doctor_id INTEGER,
    appointment_id INTEGER,
    request_date TEXT,
    realization_date TEXT,
    result TEXT,
    notes TEXT,
    status TEXT,
    scheduled_by TEXT
  );

  CREATE TABLE IF NOT EXISTS sys_users (
    id INTEGER PRIMARY KEY,
    name TEXT,
    email TEXT,
    role TEXT,
    active BOOLEAN,
    password TEXT,
    patient_id INTEGER,
    doctor_id INTEGER,
    must_change_password BOOLEAN
  );

  CREATE TABLE IF NOT EXISTS prontuarios (
    id INTEGER PRIMARY KEY,
    patient_id INTEGER,
    doctor_id INTEGER,
    date TEXT,
    title TEXT,
    content TEXT,
    appointment_id INTEGER
  );
`;

// --- Mapeamento entre o formato do front (camelCase, um array por entidade)
// e as colunas das tabelas (snake_case) ---

const TABLES = {
  patients: {
    columns: ["id", "name", "cpf", "phone", "email", "dob", "address"],
    toRow: (p) => [p.id, p.name, p.cpf, p.phone, p.email, p.dob, p.address],
    toObj: (r) => ({ id: r.id, name: r.name, cpf: r.cpf, phone: r.phone, email: r.email, dob: r.dob, address: r.address }),
  },
  doctors: {
    columns: ["id", "name", "crm", "specialty", "phone", "email"],
    toRow: (d) => [d.id, d.name, d.crm, d.specialty, d.phone, d.email],
    toObj: (r) => ({ id: r.id, name: r.name, crm: r.crm, specialty: r.specialty, phone: r.phone, email: r.email }),
  },
  appointments: {
    columns: ["id", "patient_id", "doctor_id", "date", "time", "status", "reason", "notes", "scheduled_by"],
    toRow: (a) => [a.id, a.patientId, a.doctorId, a.date, a.time, a.status, a.reason, a.notes, a.scheduledBy ?? null],
    toObj: (r) => ({
      id: r.id, patientId: r.patient_id, doctorId: r.doctor_id, date: r.date, time: r.time,
      status: r.status, reason: r.reason, notes: r.notes,
      ...(r.scheduled_by !== null ? { scheduledBy: r.scheduled_by } : {}),
    }),
  },
  exams: {
    columns: ["id", "name", "type", "patient_id", "doctor_id", "appointment_id", "request_date", "realization_date", "result", "notes", "status", "scheduled_by"],
    toRow: (e) => [e.id, e.name, e.type, e.patientId, e.doctorId, e.appointmentId ?? null, e.requestDate, e.realizationDate ?? null, e.result ?? null, e.notes ?? null, e.status, e.scheduledBy ?? null],
    toObj: (r) => ({
      id: r.id, name: r.name, type: r.type, patientId: r.patient_id, doctorId: r.doctor_id,
      ...(r.appointment_id !== null ? { appointmentId: r.appointment_id } : {}),
      requestDate: r.request_date,
      ...(r.realization_date !== null ? { realizationDate: r.realization_date } : {}),
      ...(r.result !== null ? { result: r.result } : {}),
      ...(r.notes !== null ? { notes: r.notes } : {}),
      status: r.status,
      ...(r.scheduled_by !== null ? { scheduledBy: r.scheduled_by } : {}),
    }),
  },
  sysUsers: {
    table: "sys_users",
    columns: ["id", "name", "email", "role", "active", "password", "patient_id", "doctor_id", "must_change_password"],
    toRow: (u) => [u.id, u.name, u.email, u.role, u.active, u.password, u.patientId ?? null, u.doctorId ?? null, u.mustChangePassword ?? false],
    toObj: (r) => ({
      id: r.id, name: r.name, email: r.email, role: r.role, active: r.active, password: r.password,
      ...(r.patient_id !== null ? { patientId: r.patient_id } : {}),
      ...(r.doctor_id !== null ? { doctorId: r.doctor_id } : {}),
      ...(r.must_change_password !== null ? { mustChangePassword: r.must_change_password } : {}),
    }),
  },
  prontuarios: {
    columns: ["id", "patient_id", "doctor_id", "date", "title", "content", "appointment_id"],
    toRow: (p) => [p.id, p.patientId, p.doctorId, p.date, p.title, p.content, p.appointmentId ?? null],
    toObj: (r) => ({
      id: r.id, patientId: r.patient_id, doctorId: r.doctor_id, date: r.date, title: r.title, content: r.content,
      ...(r.appointment_id !== null ? { appointmentId: r.appointment_id } : {}),
    }),
  },
};

function tableName(key) {
  return TABLES[key].table ?? key;
}

export async function initDb() {
  await pool.query(CREATE_TABLES_SQL);

  // Só semeia com os dados de exemplo se o banco estiver completamente vazio
  // (evita sobrescrever dados reais em reinicializações futuras).
  const { rows } = await pool.query("SELECT COUNT(*)::int AS count FROM sys_users");
  if (rows[0].count === 0) {
    const seed = JSON.parse(fs.readFileSync(SEED_PATH, "utf-8"));
    await saveState(seed);
    console.log("Banco vazio detectado — populado com os dados iniciais (seed.json).");
  }
}

export async function loadState() {
  const state = {};
  for (const key of Object.keys(TABLES)) {
    const { columns, toObj } = TABLES[key];
    const { rows } = await pool.query(`SELECT ${columns.join(", ")} FROM ${tableName(key)} ORDER BY id ASC`);
    state[key] = rows.map(toObj);
  }
  return state;
}

export async function saveState(state) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const key of Object.keys(TABLES)) {
      const { columns, toRow } = TABLES[key];
      const table = tableName(key);
      const items = Array.isArray(state[key]) ? state[key] : [];

      await client.query(`DELETE FROM ${table}`);

      if (items.length > 0) {
        const valuesSql = [];
        const params = [];
        items.forEach((item, i) => {
          const row = toRow(item);
          const placeholders = row.map((_, j) => `$${i * row.length + j + 1}`);
          valuesSql.push(`(${placeholders.join(", ")})`);
          params.push(...row);
        });
        await client.query(
          `INSERT INTO ${table} (${columns.join(", ")}) VALUES ${valuesSql.join(", ")}`,
          params
        );
      }
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
