import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { userId } = session;

  const sql = getDb();
  const rows = await sql`SELECT value FROM settings WHERE key = 'google_tokens' AND user_id = ${userId}`;
  return NextResponse.json({ connected: rows.length > 0 });
}
