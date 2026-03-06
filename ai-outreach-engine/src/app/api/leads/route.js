/**
 * Leads API Route (MVC: Route/Controller Layer)
 * 
 * Handles CRUD operations for leads via Next.js API routes.
 * 
 * GET    /api/leads          → List all leads
 * GET    /api/leads?status=X → List leads filtered by status
 * POST   /api/leads          → Create lead(s) — supports single or bulk
 */
import { NextResponse } from "next/server";

/* Dynamic import to avoid issues with better-sqlite3 native bindings */
async function getLeadModel() {
  const Lead = require("@/models/Lead");
  return Lead;
}

/* GET — Retrieve all leads */
export async function GET(request) {
  try {
    const Lead = await getLeadModel();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const leads = Lead.findAll(status || undefined);
    const count = Lead.count();

    return NextResponse.json({
      success: true,
      count,
      data: leads,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/* POST — Create one or more leads */
export async function POST(request) {
  try {
    const Lead = await getLeadModel();
    const body = await request.json();

    /* Bulk create if an array is provided */
    if (Array.isArray(body.leads)) {
      const count = Lead.bulkCreate(body.leads);
      const allLeads = Lead.findAll();
      return NextResponse.json({
        success: true,
        message: `${count} leads imported successfully`,
        count: allLeads.length,
        data: allLeads,
      });
    }

    /* Single lead creation */
    if (!body.name || !body.email) {
      return NextResponse.json(
        { success: false, error: "Name and email are required" },
        { status: 400 }
      );
    }

    const lead = Lead.create(body);
    return NextResponse.json({ success: true, data: lead }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
