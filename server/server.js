import express from "express";
import cors from "cors";
import { initDb, loadState, saveState, loadAuditLog, appendAuditEntry } from "./db.js";

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

const app = express();

app.use(
  cors({
    origin: ALLOWED_ORIGINS.length ? ALLOWED_ORIGINS : true,
  })
);
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "vidamaissaude-backend", storage: "postgres" });
});

// Returns the whole application state (patients, doctors, appointments, ...)
app.get("/api/data", async (_req, res) => {
  try {
    res.json(await loadState());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Falha ao ler os dados do banco." });
  }
});

// Replaces the whole application state. The frontend sends the full
// state object every time something changes (simple by design — good
// enough for a study project; a production app would use per-resource
// REST endpoints instead).
app.put("/api/data", async (req, res) => {
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
    await saveState(body);
    res.json(body);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Falha ao salvar os dados no banco." });
  }
});

// Resets the stored data back to the original seed data.
app.post("/api/reset", async (_req, res) => {
  try {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const seed = JSON.parse(fs.readFileSync(path.join(__dirname, "data", "seed.json"), "utf-8"));
    await saveState(seed);
    res.json(seed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Falha ao resetar os dados." });
  }
});

// Log de auditoria — tabela à parte, só cresce (nunca é sobrescrita por inteiro).
app.get("/api/audit", async (_req, res) => {
  try {
    res.json(await loadAuditLog());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Falha ao ler o log de auditoria." });
  }
});

app.post("/api/audit", async (req, res) => {
  const entry = req.body;
  if (!entry || typeof entry !== "object" || !entry.id || !entry.timestamp || !entry.user || !entry.action) {
    return res.status(400).json({ error: "Registro de auditoria inválido." });
  }
  try {
    await appendAuditEntry(entry);
    res.status(201).json(entry);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Falha ao gravar o registro de auditoria." });
  }
});

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Backend Vida + Saúde rodando em http://localhost:${PORT} (Postgres)`);
    });
  })
  .catch((err) => {
    console.error("Falha ao conectar/preparar o banco de dados:", err);
    process.exit(1);
  });
