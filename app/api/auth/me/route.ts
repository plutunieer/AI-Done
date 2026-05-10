import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ user: null });

  const sql = getDb();
  const rows = await sql`SELECT id, email, name FROM users WHERE id = ${session.userId}`;
  const user = rows[0] as { id: number; email: string; name: string | null } | undefined;

  return NextResponse.json({ user: user ?? null });
}
