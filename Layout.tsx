import express from "express";
import cors from "cors";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SEED_PATH = path.join(__dirname, "data", "seed.json");
const DB_PATH = path.join(__dirname, "data", "db.json");

const PORT = process.env.PORT || 4000;

// Comma-separated list of allowed frontend origins, e.g.
// "https://meu-app.vercel.app,http://localhost:5173"
// If not set, allows any origin (fine for study projects, not for production).
const ALLOWED_ORIGINS = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const EXPECTED_KEYS = [
  "patients",
  "doctors",
  "appointments",
  "exams",
  "sysUsers",
  "prontuarios",
];

function loadState() {
  if (!fs.existsSync(DB_PATH)) {
    const seed = fs.readFileSync(SEED_PATH, "utf-8");
    fs.writeFileSync(DB_PATH, seed);
  }
  return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
}

function saveState(state) {
  fs.writeFileSync(DB_PATH, JSON.stringify(state, null, 2));
}

const app = express();

app.use(
  cors({
    origin: ALLOWED_ORIGINS.length ? ALLOWED_ORIGINS : true,
  })
);
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "vidamaissaude-backend" });
});

// Returns the whole application state (patients, doctors, appointments, ...)
app.get("/api/data", (_req, res) => {
  try {
    res.json(loadState());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Falha ao ler os dados." });
  }
});

// Replaces the whole application state. The frontend sends the full
// state object every time something changes (simple by design — good
// enough for a study project; a production app would use per-resource
// REST endpoints instead).
app.put("/api/data", (req, res) => {
  const body = req.body;
  if (!body || typeof body !== "object") {
    return res.status(400).json({ error: "Corpo inválido." });
  }
  for (const key of EXPECTED_KEYS) {
    if (!Array.isArray(body[key])) {
      return res.status(400).json({ error: `Campo ausente ou inválido: ${key}` });
    }
  }
  try {
    saveState(body);
    res.json(body);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Falha ao salvar os dados." });
  }
});

// Resets the stored data back to the original seed data.
app.post("/api/reset", (_req, res) => {
  try {
    const seed = JSON.parse(fs.readFileSync(SEED_PATH, "utf-8"));
    saveState(seed);
    res.json(seed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Falha ao resetar os dados." });
  }
});

app.listen(PORT, () => {
  console.log(`Backend Vida + Saúde rodando em http://localhost:${PORT}`);
});
