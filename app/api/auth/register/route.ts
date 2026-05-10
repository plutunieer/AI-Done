import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";
import { createSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { email, password, name } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email und Passwort erforderlich" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Passwort muss mindestens 8 Zeichen haben" }, { status: 400 });
  }

  const sql = getDb();
  const rows = await sql`SELECT id, password_hash FROM users WHERE email = ${email.toLowerCase().trim()}`;
  const existing = rows[0] as { id: number; password_hash: string } | undefined;

  const hash = await bcrypt.hash(password, 12);

  let userId: number;
  if (existing) {
    if (existing.password_hash !== "__NEEDS_RESET__") {
      return NextResponse.json({ error: "Diese Email ist bereits registriert" }, { status: 409 });
    }
    await sql`UPDATE users SET password_hash = ${hash}, name = COALESCE(${name ?? null}, name) WHERE id = ${existing.id}`;
    userId = existing.id;
  } else {
    const result = await sql`INSERT INTO users (email, password_hash, name) VALUES (${email.toLowerCase().trim()}, ${hash}, ${name ?? null}) RETURNING id`;
    userId = result[0].id;
  }

  await createSession({ userId, email: email.toLowerCase().trim() });
  return NextResponse.json({ success: true });
}
