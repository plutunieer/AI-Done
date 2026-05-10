import { NextResponse } from "next/server";
import { getAuthUrl } from "@/lib/calendar";

export async function GET() {
  try {
    const url = getAuthUrl();
    return NextResponse.json({ url });
  } catch {
    return NextResponse.json(
      { error: "Google OAuth nicht konfiguriert" },
      { status: 500 }
    );
  }
}
