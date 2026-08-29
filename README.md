# Vida + Saúde — Frontend + Backend

Este projeto veio do Figma Make como um app **100% frontend** (React + Vite),
com todos os dados guardados só na memória do navegador — ao dar refresh,
tudo voltava ao estado inicial.

Foi adicionado um **backend em Node.js/Express** (pasta `server/`) que guarda
os dados em um **banco Postgres**, e o `DataContext.tsx` do frontend
foi ajustado para buscar e salvar os dados nesse backend automaticamente.
Nenhuma outra página foi alterada — elas continuam usando `useData()`
normalmente.

## Estrutura

```
/                → frontend (React + Vite)
/server          → backend (Express + Postgres)
```

## Rodando local

### 1. Backend

Você precisa de um Postgres rodando (local ou um banco free do Render/Supabase/Neon).

```bash
cd server
npm install
cp .env.example .env      # preencha DATABASE_URL com a connection string do seu Postgres
npm run dev                # sobe em http://localhost:4000
```

Na primeira vez que o servidor sobe, ele cria as tabelas automaticamente e,
se estiverem vazias, popula com os dados de exemplo de `data/seed.json`.

### 2. Frontend

Em outro terminal, na raiz do projeto:

```bash
npm install
cp .env.example .env.local   # já vem com VITE_API_URL=http://localhost:4000
npm run dev                   # sobe em http://localhost:8443 (ou porta do $PORT)
```

Abra o endereço mostrado no terminal. Se quiser rodar **sem** backend (como
era antes, sem persistência), basta deixar `VITE_API_URL` vazio no `.env.local`.

### Usuários de teste (senha em `server/data/seed.json`)

| Papel      | E-mail                        | Senha      |
|------------|--------------------------------|------------|
| Admin      | admin@vidamaissaude.com        | admin123   |
| Atendente  | atendente@vidamaissaude.com    | atend123   |
| Médico     | medico@vidamaissaude.com       | medico123  |
| Paciente   | paciente@vidamaissaude.com     | pac123     |

> Senhas em texto puro — ok para um projeto de estudo, **nunca** faça isso em produção.

## Como funciona a persistência

O backend expõe 3 rotas simples:

- `GET /api/data` — devolve tudo (pacientes, médicos, consultas, exames, usuários, prontuários), lendo das tabelas do Postgres.
- `PUT /api/data` — recebe o JSON completo e regrava cada tabela (dentro de uma transação: se algo falhar no meio, nada é perdido).
- `POST /api/reset` — restaura os dados originais (`seed.json`).

O frontend busca esse JSON quando o app abre e, a cada mudança de estado
(criar/editar/excluir paciente, marcar consulta, etc.), reenvia o JSON
inteiro pro backend (com um pequeno debounce de 400ms). É uma abordagem
simples de propósito — ótima pra entender o conceito de front↔back sem
reescrever as 12 páginas do app com chamadas de API uma a uma, mesmo os
dados já estando guardados em tabelas relacionais de verdade (`patients`,
`doctors`, `appointments`, `exams`, `sys_users`, `prontuarios`).

Diferente de um arquivo JSON local, o Postgres **sobrevive** ao serviço
"dormir"/reiniciar no Render — só some se você apagar o banco.

## Deploy online (grátis) — passo a passo

### Passo 1 — Subir o backend no Render

1. Crie um repositório no GitHub com este projeto (frontend + `server/` juntos).
2. Em [render.com](https://render.com), clique em **New > Web Service** e conecte o repositório.
3. Configure:
   - **Root Directory:** `server`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free
4. Nas variáveis de ambiente (**Environment**), adicione:
   - `DATABASE_URL` = a *Internal Database URL* do seu banco Postgres do Render (crie um em **New > PostgreSQL** antes, se ainda não tiver).
   - `FRONTEND_URL` = a URL que o Vercel vai te dar (ex: `https://seu-app.vercel.app`) — pode deixar em branco por enquanto e voltar depois (passo 3).
5. Deploy. Anote a URL gerada, algo como `https://vidamaissaude-backend.onrender.com`.

> ⚠️ O Postgres free do Render expira 30 dias após a criação (mais 14 dias
> de tolerância antes de apagar os dados de vez). O serviço web em si
> "dorme" após ~15 min sem uso (o primeiro acesso demora ~30-60s pra
> acordar) — mas os dados no Postgres não são afetados por isso, só o
> tempo de resposta da primeira requisição.

### Passo 2 — Subir o frontend no Vercel

1. Em [vercel.com](https://vercel.com), **Add New > Project**, conecte o mesmo repositório.
2. Configure:
   - **Root Directory:** raiz do projeto (não a `server/`)
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build` (padrão)
   - **Output Directory:** `dist` (padrão)
3. Em **Environment Variables**, adicione:
   - `VITE_API_URL` = a URL do backend do Render (ex: `https://vidamaissaude-backend.onrender.com`), **sem barra no final**.
4. Deploy. Você recebe uma URL tipo `https://seu-app.vercel.app`.

### Passo 3 — Fechar o CORS

Volte no Render e defina `FRONTEND_URL` com a URL exata do Vercel (pode
colocar mais de uma, separadas por vírgula, se quiser incluir
`http://localhost:5173` pra testar local também). Redeploy o backend pra
aplicar.

Pronto — o app estará rodando 100% online, com dados persistidos no backend.

### Alternativas ao Render/Vercel

- **Railway** funciona igual ao Render para o backend (root directory `server`, start command `npm start`).
- **Netlify** é equivalente ao Vercel para o frontend.
