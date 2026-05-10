import { google } from "googleapis";
import { getDb } from "./db";

export function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

export function getAuthUrl(): string {
  const oauth2Client = getOAuthClient();
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/calendar"],
    prompt: "consent",
  });
}

export async function getAuthorizedClient(userId: number) {
  const sql = getDb();
  const rows = await sql`SELECT value FROM settings WHERE key = 'google_tokens' AND user_id = ${userId}`;
  const tokenRow = rows[0] as { value: string } | undefined;

  if (!tokenRow) throw new Error("NOT_CONNECTED");

  const oauth2Client = getOAuthClient();
  oauth2Client.setCredentials(JSON.parse(tokenRow.value));
  return oauth2Client;
}

export async function getCalendarEvents(
  timeMin: string,
  timeMax: string,
  userId: number
): Promise<{ id: string; start: string; end: string; summary: string }[]> {
  const auth = await getAuthorizedClient(userId);
  const calendar = google.calendar({ version: "v3", auth });

  const res = await calendar.events.list({
    calendarId: "primary",
    timeMin,
    timeMax,
    singleEvents: true,
    orderBy: "startTime",
  });

  return (res.data.items ?? []).map((e) => ({
    id: e.id ?? "",
    start: e.start?.dateTime ?? e.start?.date ?? "",
    end: e.end?.dateTime ?? e.end?.date ?? "",
    summary: e.summary ?? "",
  }));
}

export async function createCalendarEvent(
  title: string,
  startISO: string,
  durationMinutes: number,
  userId: number
): Promise<string> {
  const auth = await getAuthorizedClient(userId);
  const calendar = google.calendar({ version: "v3", auth });

  const start = new Date(startISO);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

  const res = await calendar.events.insert({
    calendarId: "primary",
    requestBody: {
      summary: title,
      start: { dateTime: start.toISOString() },
      end: { dateTime: end.toISOString() },
    },
  });

  return res.data.id ?? "";
}

export async function deleteCalendarEvent(eventId: string, userId: number): Promise<void> {
  const auth = await getAuthorizedClient(userId);
  const calendar = google.calendar({ version: "v3", auth });
  await calendar.events.delete({ calendarId: "primary", eventId });
}
