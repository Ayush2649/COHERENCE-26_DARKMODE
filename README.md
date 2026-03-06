# AI Outreach Automation Engine

Mailchimp-style outreach automation platform with a visual workflow builder and AI-generated messaging. Built with **MVC architecture** for a hackathon MVP.

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
