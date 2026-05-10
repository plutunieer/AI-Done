import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";
import { createSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email und Passwort erforderlich" }, { status: 400 });
  }

  const sql = getDb();
  const rows = await sql`SELECT id, email, password_hash FROM users WHERE email = ${email.toLowerCase().trim()}`;
  const user = rows[0] as { id: number; email: string; password_hash: string } | undefined;

  if (!user || user.password_hash === "__NEEDS_RESET__") {
    return NextResponse.json({ error: "Email oder Passwort falsch" }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return NextResponse.json({ error: "Email oder Passwort falsch" }, { status: 401 });
  }

  await createSession({ userId: user.id, email: user.email });
  return NextResponse.json({ success: true });
}
