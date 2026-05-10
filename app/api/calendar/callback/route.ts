import { NextRequest, NextResponse } from "next/server";
import { getOAuthClient } from "@/lib/calendar";
import { getDb } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { userId } = session;

  const code = req.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.json({ error: "No code" }, { status: 400 });

  const oauth2Client = getOAuthClient();
  const { tokens } = await oauth2Client.getToken(code);

  const sql = getDb();
  await sql`
    INSERT INTO settings (key, value, user_id) VALUES ('google_tokens', ${JSON.stringify(tokens)}, ${userId})
    ON CONFLICT (key, user_id) DO UPDATE SET value = EXCLUDED.value
  `;

  return NextResponse.redirect(new URL("/?calendar=connected", req.url));
}
