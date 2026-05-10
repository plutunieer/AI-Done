import { NextRequest, NextResponse } from "next/server";
import { chat, Message } from "@/lib/buddy";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { userId } = session;

  const sql = getDb();
  const rows = await sql`SELECT role, content FROM conversations WHERE user_id = ${userId} ORDER BY id ASC`;
  return NextResponse.json({ messages: rows });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { userId } = session;

  const { message } = await req.json();
  if (!message?.trim()) return NextResponse.json({ error: "Empty message" }, { status: 400 });

  const sql = getDb();

  const rows = await sql`SELECT role, content FROM conversations WHERE user_id = ${userId} ORDER BY id DESC LIMIT 20`;
  const history: Message[] = [...(rows as { role: "user" | "assistant"; content: string }[]).reverse(), { role: "user", content: message }];

  await sql`INSERT INTO conversations (role, content, user_id) VALUES ('user', ${message}, ${userId})`;

  try {
    const reply = await chat(history, userId);
    await sql`INSERT INTO conversations (role, content, user_id) VALUES ('assistant', ${reply}, ${userId})`;
    return NextResponse.json({ reply });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
