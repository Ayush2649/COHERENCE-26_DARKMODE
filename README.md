# AI Outreach Automation Engine

Mailchimp-style outreach automation platform with a visual workflow builder and AI-generated messaging. Built with **MVC architecture** for a hackathon MVP.

---

## Sending real emails (Resend)

To send real emails to lead addresses (e.g. your own for testing):

1. **Sign up at [Resend](https://resend.com)** and create an API key at [resend.com/api-keys](https://resend.com/api-keys).
2. **Add to `.env.local`**:
   ```bash
   RESEND_API_KEY=re_your_key_here
   ```
3. **Optional**: `RESEND_FROM` (default: `Outreach <onboarding@resend.dev>` for testing); `EMAIL_SUBJECT` (default: `Quick outreach`).
4. **Upload leads** with real email addresses (e.g. your email) on the Lead Upload page.
5. **Run a campaign** in the Campaign Simulator with a workflow that has Send Email or Send Follow-up nodes. When the engine hits those nodes, it will call Resend and send the AI-generated message to each lead’s email.

Without `RESEND_API_KEY`, the app only logs messages to the database and does not send email.

---

## STEP 1 — Project Initialization ✅

### What Was Implemented

- **Next.js 14** with App Router (`src/app/`)
- **Tailwind CSS** for styling (with ShadCN-compatible CSS variables)
- **ShadCN-style setup**: `components.json`, `cn()` utility, and a reusable `Button` component
- **MVC folder structure** under `/src`:
  - `models/` — data models (Step 2)
  - `controllers/` — request handlers
  - `routes/` — API route definitions
  - `services/` — business logic
  - `views/` — page-level view components
  - `components/` — reusable UI (including `ui/button`)
  - `utils/` — helpers (e.g. `cn.ts`)
  - `queue/` — job processing (later steps)
  - `database/` — DB connection and migrations (Step 2)

### MVC Layer for Step 1

- **View**: `src/app/page.tsx` (home), `src/app/leads/page.tsx`, `src/app/workflow/page.tsx` — presentation only; no models or controllers yet.

---

### How to Install Dependencies

From the project root:

```bash
npm install
```

This installs Next.js, React, Tailwind, TypeScript, and ShadCN-related packages (`class-variance-authority`, `clsx`, `tailwind-merge`, `@radix-ui/react-slot`).

---

### How to Run the Project

**Development (with hot reload):**

```bash
npm run dev
```

Then open **http://localhost:3000** in your browser.

**Production build and run:**

```bash
npm run build
npm start
```

Then open **http://localhost:3000**.

---

### How to Verify It Works

1. **Home page**  
   - You should see: “AI Outreach Automation Engine” and two buttons: “Upload Leads” and “Workflow Builder”.

2. **Navigation**  
   - Click “Upload Leads” → `/leads` (placeholder: “Lead upload (Step 3) — coming next.”).  
   - Click “Workflow Builder” → `/workflow` (placeholder: “Workflow builder (Step 4) — coming next.”).

3. **Build**  
   - Run `npm run build`. It should complete with “Compiled successfully” and list routes: `/`, `/_not-found`, `/leads`, `/workflow`.

---

### TESTING GUIDE (Step 1)

| Step | Action | Expected result |
|------|--------|-----------------|
| 1 | `npm install` | Dependencies install without errors. |
| 2 | `npm run dev` | Server starts; “Ready on http://localhost:3000” (or similar). |
| 3 | Open http://localhost:3000 | Home page with title and two buttons. |
| 4 | Click “Upload Leads” | Navigate to `/leads`, placeholder text visible. |
| 5 | Click “Workflow Builder” | Navigate to `/workflow`, placeholder text visible. |
| 6 | `npm run build` | Build succeeds; no TypeScript or lint errors. |

---

### EXPECTED RESULT

- Next.js app runs with Tailwind and ShadCN-style theming.
- Home page renders with correct styling and working links.
- Folder structure under `src/` is in place for MVC (models, controllers, routes, services, views, components, utils, queue, database).
- You can proceed to **Step 2 — Database Models**.

---

## STEP 2 — Database Models (MVC: Models) ✅

### What Was Implemented

- **SQLite** database via `better-sqlite3` (file: `data/outreach.db`, created on first use).
- **Schema** in `src/database/schema.sql`: four tables with indexes and constraints.
- **Connection** in `src/database/connection.ts`: singleton `getDb()`, creates `data/` if needed.
- **Init** in `src/database/init.ts`: `initDatabase()` runs the schema (safe to call multiple times).
- **Models** in `src/models/`:
  - **Lead** — id, name, email, company, role, status, currentStep (+ createdAt, updatedAt).
  - **Workflow** — id, name, nodes (JSON), edges (JSON) (+ createdAt, updatedAt).
  - **Campaign** — id, workflowId, status, startTime (+ createdAt, updatedAt).
  - **EmailLog** — id, leadId, campaignId, message, status, sentAt.

### How Each Model Is Used

| Model     | Purpose |
|----------|---------|
| **Lead** | Contacts to target; status and currentStep track progress through a workflow. |
| **Workflow** | Visual definition (React Flow nodes/edges) stored as JSON; used by the builder and campaign engine. |
| **Campaign** | A single run of a workflow; status (draft/running/paused/completed) and startTime. |
| **EmailLog** | One row per email sent; used for analytics, rate limiting, and duplicate prevention. |

### MVC Layer

- **Models**: `src/models/Lead.ts`, `Workflow.ts`, `Campaign.ts`, `EmailLog.ts` — types + CRUD (create, getById, list, update). No views or HTTP here; controllers/API routes will use these.

### How to Test Database Operations

1. **Initialize the DB** (creates tables):
   ```bash
   npm run dev
   ```
   Then open: **http://localhost:3000/api/db/init**  
   Expected JSON: `{ "ok": true, "message": "Database initialized." }`

2. **Run the test route** (inserts one lead, one workflow, one campaign, one email log):
   ```bash
   Open: http://localhost:3000/api/db/test
   ```
   Expected JSON includes:
   - `ok: true`, `message: "Database test passed."`
   - `counts`: `{ leads: 1, workflows: 1, campaigns: 1 }`
   - `sampleLead`: `{ id, email, name }`
   - `sampleWorkflow`: `{ id, name }`

3. **Call `/api/db/test` again** — counts increase (new lead/workflow/campaign/email each time). The DB file is at `data/outreach.db`.

### TESTING GUIDE (Step 2)

| Step | Action | Expected result |
|------|--------|-----------------|
| 1 | `npm run dev` | Dev server running. |
| 2 | GET http://localhost:3000/api/db/init | `{ "ok": true, "message": "Database initialized." }`. |
| 3 | GET http://localhost:3000/api/db/test | `ok: true`, `counts.leads >= 1`, `sampleLead` and `sampleWorkflow` present. |
| 4 | GET http://localhost:3000/api/db/test again | Counts increase (e.g. leads: 2, workflows: 2). |
| 5 | Check `data/outreach.db` | File exists (SQLite DB). |

### EXPECTED RESULT

- All four models (Lead, Workflow, Campaign, EmailLog) exist with types and CRUD.
- Init and test API routes run without errors.
- You can proceed to **Step 3 — Lead Upload System**.

---

## STEP 3 — Lead Upload System ✅

### What Was Implemented

- **Lead Upload Page** (`src/app/leads/page.tsx`): file input for CSV, parse with PapaParse, preview table, “Save to database” and “Verify: count leads in DB”.
- **Leads API** (`src/app/api/leads/route.ts`): `GET` returns all leads; `POST` accepts `{ leads: [{ name, email, company?, role? }] }` and saves via `Lead.createLeadsBatch()` (duplicates by email are skipped with `INSERT OR IGNORE`).
- **Sample CSV** in repo: `sample-leads.csv` (name, email, company, role).

### How CSV Parsing Works

- The user selects a `.csv` file. **PapaParse** runs with `header: true`, so the first row becomes keys and each following row is an object.
- Headers are matched **case-insensitively** (e.g. `Name` or `name`, `Email` or `email`). Columns `company` and `role` are optional.
- Rows are mapped to `{ name, email, company, role }`. Only rows with both `name` and `email` are kept and shown in the preview table.
- On “Save to database”, the frontend sends the same array to `POST /api/leads`. The API normalizes and validates; then `Lead.createLeadsBatch()` runs in a single transaction. Existing emails (UNIQUE) are skipped (`INSERT OR IGNORE`), so `saved` may be less than `total`.

### How Leads Are Stored

- Each lead is inserted into the `leads` table (see Step 2 schema). `createLeadsBatch()` uses a SQLite transaction and `INSERT OR IGNORE` so duplicate emails do not cause errors; the returned `saved` count is the number of rows actually inserted.

### MVC Layer

- **View**: `src/app/leads/page.tsx` — UI (file input, preview table, buttons).
- **Route/Controller**: `src/app/api/leads/route.ts` — HTTP GET/POST and validation; calls **Model** `Lead.createLeadsBatch()` / `Lead.getLeads()`.

### Sample CSV

Use this (or the file `sample-leads.csv` in the project root):

```csv
name,email,company,role
John,john@tesla.com,Tesla,CTO
Sarah,sarah@openai.com,OpenAI,Engineer
```

### How to Upload and Verify Leads Were Saved

1. Run `npm run dev` and open **http://localhost:3000/leads**.
2. Click “Choose CSV file” and select `sample-leads.csv` (or a file with the same columns).
3. Confirm the preview table shows 2 rows (John, Sarah).
4. Click “Save to database”. You should see: “Saved 2 of 2 leads…” (or “Saved 1 of 2…” if one email already existed).
5. Click “Verify: count leads in DB”. The page should show “Total leads in database: N” (N ≥ 2).
6. Optional: open **http://localhost:3000/api/leads** in the browser to see the full JSON list of leads.

### TESTING GUIDE (Step 3)

| Step | Action | Expected result |
|------|--------|-----------------|
| 1 | Open http://localhost:3000/leads | Upload page with “Choose CSV file” and “Save to database”. |
| 2 | Select `sample-leads.csv` | Preview table shows 2 rows: John (john@tesla.com), Sarah (sarah@openai.com). |
| 3 | Click “Save to database” | Green message: “Saved 2 of 2 leads…” (or 1 of 2 if duplicate). |
| 4 | Click “Verify: count leads in DB” | “Total leads in database: 2” (or higher). |
| 5 | GET http://localhost:3000/api/leads | JSON with `ok: true`, `leads: [...]`, `count: N`. |

### EXPECTED RESULT

- CSV upload, preview, and save work; leads are stored in SQLite; duplicate emails are skipped; count verification works.
- You can proceed to **Step 4 — Workflow Builder**.

---

## STEP 4 — Workflow Builder (Mailchimp Style) ✅

### What Was Implemented

- **React Flow** (`@xyflow/react`) for the visual canvas: drag nodes, connect with edges, zoom/pan, minimap, controls.
- **Custom node types** in `src/components/workflow/`: **Start**, **Send Email**, **Wait**, **Condition**, **Send Follow-up**, **End**. Each has Handles (source/target) so edges can connect them.
- **Workflow Builder page** (`src/app/workflow/page.tsx`): name input, “+ Add node” buttons, Save/Update, Load list + select to load a workflow.
- **Workflow API**: `GET/POST /api/workflows`, `GET/PUT /api/workflows/[id]` — load/save workflow as `{ nodes, edges }` JSON using the Workflow model.

### How React Flow Works

- **Nodes** are positioned on a canvas; each has a `type` (e.g. `start`, `sendEmail`), `position: { x, y }`, and optional `data`. Custom components render per type.
- **Edges** link two nodes via `source` and `target` node ids (and optional `sourceHandle`/`targetHandle` for multiple handles).
- **Handles** on nodes are connection points: `type="target"` (incoming) and `type="source"` (outgoing). Dragging from one handle to another creates an edge.
- **State**: `useNodesState` and `useEdgesState` manage nodes/edges; `onNodesChange`/`onEdgesChange` update them; `onConnect` adds a new edge when the user connects two handles.

### How Nodes Connect

- User drags from a **source** Handle (e.g. bottom of Start) to a **target** Handle (e.g. top of Send Email). React Flow calls `onConnect` with `{ source, target, sourceHandle?, targetHandle? }`; we add the edge with `addEdge(params, edges)`.

### How Workflow JSON Is Saved

- **Save**: The page sends `{ name, nodes, edges }` to `POST /api/workflows` (new) or `PUT /api/workflows/[id]` (update). The API calls `Workflow.createWorkflow()` or `Workflow.updateWorkflow()`; the model stores `nodes` and `edges` as JSON strings in the `workflows` table.
- **Load**: `GET /api/workflows` lists workflows; `GET /api/workflows/[id]` returns one. The page sets React Flow state from `workflow.nodes` and `workflow.edges` so the canvas matches the saved workflow.

### MVC Layer

- **View**: `src/app/workflow/page.tsx` and `src/components/workflow/*` — UI and custom nodes.
- **Route/Controller**: `src/app/api/workflows/route.ts`, `src/app/api/workflows/[id]/route.ts` — HTTP and validation; call **Model** `Workflow.createWorkflow`, `getWorkflowById`, `getWorkflows`, `updateWorkflow`.

### How to Create and Save a Workflow

1. Run `npm run dev` and open **http://localhost:3000/workflow**.
2. Enter a name (e.g. “Cold outreach”).
3. Click **+ Send Email**, **+ Wait**, **+ Condition**, **+ Send Follow-up**, **+ End** to add nodes. Drag them to arrange.
4. Connect: drag from the bottom handle of **Start** to the top of **Send Email**; then Send Email → Wait → Condition → Send Follow-up → End (and optionally Condition → two branches).
5. Click **Save workflow**. You should see “Workflow saved.”
6. Click **Load list**, then choose the workflow from the dropdown to load it and confirm nodes/edges match.

### TESTING GUIDE (Step 4)

| Step | Action | Expected result |
|------|--------|-----------------|
| 1 | Open http://localhost:3000/workflow | Canvas with one Start node and toolbar with “+ Start”, “+ Send Email”, etc. |
| 2 | Add “Send Email” and “End”, connect Start → Send Email → End | Edges appear between nodes. |
| 3 | Click “Save workflow” | Green “Workflow saved.” |
| 4 | Click “Load list”, select the saved workflow | Canvas shows the same nodes and edges. |
| 5 | Change name, add a node, click “Update workflow” | “Workflow updated.” |

### EXPECTED RESULT

- You can build a flow (Start → Send Email → Wait → Condition → Follow-up), connect nodes, and save/load workflow as JSON (nodes + edges).
- You can proceed to **Step 5 — AI Message Generator**.

---

## STEP 5 — AI Message Generator ✅

### What Was Implemented

- **AI Service** (`src/services/aiService.ts`): builds system + user messages and calls OpenAI (`gpt-4o-mini`).
- **API** `POST /api/ai/generate`: body `{ prompt, role, campaignContext?, leadData?: { name?, company?, role? } }`, returns `{ ok, message }`.
- **AI Message Generator page** (`src/app/ai-message/page.tsx`): form for Prompt, Role, Campaign context, optional Lead data (name, company, role); displays generated message.

### How Prompt Engineering Works

- **System message**: Defines *who* the model is (e.g. “You are writing as: Sales Manager”) and constraints (“Write a single email body only, no subject line…”). Campaign context is appended so the tone and goal are clear.
- **User message**: Contains the task (e.g. “Write a friendly cold outreach email”) and, when provided, **lead data** so the model can personalize (name, company, role).

### How Personalization Is Injected

- Optional `leadData: { name, company, role }` is sent in the request. The service appends to the user message: “Lead to personalize for: John, Tesla, CTO.” The model then uses that in the email (e.g. “Hi John”, “at Tesla”, “in your role as CTO”).

### MVC Layer

- **View**: `src/app/ai-message/page.tsx` — form and result display.
- **Controller/Route**: `src/app/api/ai/generate/route.ts` — validates body, calls service.
- **Service**: `src/services/aiService.ts` — `buildMessages()`, `generateMessage()`.

### Setup

Create `.env.local` in the project root:

```
OPENAI_API_KEY=sk-your-key-here
```

### How to Test

1. Add `OPENAI_API_KEY` to `.env.local`, then run `npm run dev`.
2. Open **http://localhost:3000/ai-message**.
3. Use default or enter: Prompt “Write a friendly cold outreach email.”, Role “Sales Manager”, Lead: Name “John”, Company “Tesla”, Role “CTO”.
4. Click **Generate message**. You should see a short email body (e.g. “Hi John, … at Tesla …”).

### Example Generated Message

Example output (actual text may vary):

```
Hi John,

I noticed you're leading the charge at Tesla as CTO and wanted to reach out. We've been helping companies in tech simplify their infrastructure, and I thought it might be relevant for you.

Would you be open to a brief call this week to explore if there's a fit?

Best,
[Your name]
```

### TESTING GUIDE (Step 5)

| Step | Action | Expected result |
|------|--------|-----------------|
| 1 | Set OPENAI_API_KEY in .env.local | No “OPENAI_API_KEY is not set” error. |
| 2 | Open http://localhost:3000/ai-message | Form with Prompt, Role, Campaign context, Lead data. |
| 3 | Click “Generate message” with defaults | Generated email body appears below. |
| 4 | Fill Lead: John, Tesla, CTO and generate | Message mentions John / Tesla / CTO. |

### EXPECTED RESULT

- You can generate outreach copy from a prompt, role, and optional campaign/lead context. Next: **Step 6 — Campaign Automation Engine**.

---

## STEP 6 — Campaign Automation Engine ✅

### What Was Implemented

- **Schema**: `leads.campaign_id` added (and migration in `initDatabase()` for existing DBs).
- **Lead model**: `campaignId`, `getLeadsByCampaignId(campaignId)`, `updateLead(..., campaignId)`.
- **Workflow engine** (`src/services/workflowEngine.ts`): `getStartNodeId`, `getNextNodeId`, `executeStep(workflow, lead, campaignId)`. For each node type: **start** → next; **sendEmail** / **sendFollowUp** → generate AI message, log to EmailLog, move to next; **wait** → next; **condition** → next (yes branch); **end** → done.
- **APIs**:  
  - `GET/POST /api/campaigns` — list, create (body: `{ workflowId }`).  
  - `POST /api/campaigns/[id]/start` — start or advance one step (body: `{ leadIds?: number[] }`; if omitted, uses all leads with status `new`).  
  - `GET /api/campaigns/[id]/logs` — email logs for the campaign.
- **Campaign Simulator page** (`src/app/campaign/page.tsx`): load workflows/leads/campaigns, create campaign, (optionally) select leads, Start/Advance step, Load campaign logs.

### Algorithm (workflow execution)

1. **Start campaign (first time)**  
   Set campaign status to `running`, set `start_time` if not set. For each selected lead (or all `new`), set `lead.campaign_id = campaignId` and `lead.current_step = startNodeId`.

2. **One tick (each “Start / Advance step”)**  
   For each lead in the campaign (`getLeadsByCampaignId`):  
   - Read `lead.currentStep` (node id).  
   - **executeStep(workflow, lead, campaignId)**:
     - **start**: next node id from edges.
     - **sendEmail** / **sendFollowUp**: call AI to generate message, `EmailLog.createEmailLog`, set lead status `contacted`, next node id.
     - **wait**: next node id (delay handled in Step 7).
     - **condition**: next node id (e.g. “yes” branch).
     - **end**: next = null.
   - Update `lead.current_step = nextNodeId` (and status if done).

3. If all leads have `current_step === null`, set campaign status to `completed`.

### How to Run Campaign and Inspect Logs

1. **Init DB (if you have an old DB)**  
   Open `GET http://localhost:3000/api/db/init` once so `campaign_id` is added to `leads`.

2. **Create workflow and leads**  
   Use Workflow Builder and Lead Upload so you have at least one workflow and a few leads.

3. **Campaign Simulator**  
   Open **http://localhost:3000/campaign**.  
   - Load workflows → select one → **Create campaign**.  
   - (Optional) Load leads → check specific leads, or leave unchecked to use all “new” leads.  
   - Select the new campaign → **Start / Advance step**. First run assigns leads and moves them from Start to the next node; next runs execute the next step (e.g. send email, then wait, etc.).  
   - **Load campaign logs** to see sent messages (from sendEmail/sendFollowUp nodes).

### TESTING GUIDE (Step 6)

| Step | Action | Expected result |
|------|--------|-----------------|
| 1 | GET /api/db/init | DB has `leads.campaign_id` (no “no such column” errors). |
| 2 | Create workflow (e.g. Start → Send Email → End), upload leads | Workflow and leads exist. |
| 3 | Campaign page: create campaign from workflow, click “Start / Advance step” | “Campaign started.”; leads show current step. |
| 4 | Click “Start / Advance step” again | Emails generated and logged; leads advance or complete. |
| 5 | “Load campaign logs” | List of email logs with message text. |

### EXPECTED RESULT

- You can start a campaign from a workflow, assign leads, advance steps (workflow engine runs sendEmail/sendFollowUp with AI, wait, condition, end), and inspect logs. Next: **Step 7 — Time Simulation**.
