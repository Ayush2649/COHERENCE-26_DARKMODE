/**
 * Leads API - MVC: Route + Controller
 * GET: list all leads (for verification after upload)
 * POST: save leads from CSV (body: { leads: Array<{ name, email, company?, role? }> })
 */

import { initDatabase } from "@/database/init";
import * as Lead from "@/models/Lead";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    initDatabase();
    const leads = Lead.getLeads();
    return NextResponse.json({ ok: true, leads, count: leads.length });
  } catch (err) {
    console.error("GET /api/leads error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

/** Request body for bulk lead upload */
export interface CreateLeadsBody {
  leads: Array<{
    name: string;
    email: string;
    company?: string;
    role?: string;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    initDatabase();
    const body = (await request.json()) as CreateLeadsBody;
    if (!Array.isArray(body?.leads) || body.leads.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Request body must include a non-empty 'leads' array." },
        { status: 400 }
      );
    }
    // Normalize: require name and email; trim strings
    const normalized = body.leads.map((row) => ({
      name: String(row.name ?? "").trim(),
      email: String(row.email ?? "").trim(),
      company: row.company != null ? String(row.company).trim() : undefined,
      role: row.role != null ? String(row.role).trim() : undefined,
    }));
    const invalid = normalized.filter((r) => !r.name || !r.email);
    if (invalid.length > 0) {
      return NextResponse.json(
        { ok: false, error: "Each lead must have 'name' and 'email'.", invalidCount: invalid.length },
        { status: 400 }
      );
    }
    const saved = Lead.createLeadsBatch(normalized);
    return NextResponse.json({ ok: true, saved, total: normalized.length });
  } catch (err) {
    console.error("POST /api/leads error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
