import { NextRequest, NextResponse } from "next/server";
import { getCalendarEvents } from "@/lib/calendar";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { userId } = session;

  const timeMin = req.nextUrl.searchParams.get("timeMin");
  const timeMax = req.nextUrl.searchParams.get("timeMax");
  if (!timeMin || !timeMax) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }
  try {
    const events = await getCalendarEvents(timeMin, timeMax, userId);
    return NextResponse.json({ events });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "NOT_CONNECTED") {
      return NextResponse.json({ error: "NOT_CONNECTED" }, { status: 401 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
