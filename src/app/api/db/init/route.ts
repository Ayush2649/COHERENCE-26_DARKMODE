/**
 * Initialize database (create tables).
 * GET /api/db/init - safe to call multiple times (IF NOT EXISTS).
 */

import { initDatabase } from "@/database/init";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    initDatabase();
    return NextResponse.json({ ok: true, message: "Database initialized." });
  } catch (err) {
    console.error("DB init error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
