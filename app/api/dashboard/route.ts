import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCalendarEvents } from "@/lib/calendar";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { userId } = session;

  const sql = getDb();
  const now = new Date();

  const rangeMin = req.nextUrl.searchParams.get("from")
    ?? new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const rangeMax = req.nextUrl.searchParams.get("to")
    ?? new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();

  // Calendar-Events für den Zeitraum importieren
  try {
    const calEvents = await getCalendarEvents(rangeMin, rangeMax, userId);
    for (const e of calEvents) {
      if (!e.id) continue;
      const existing = await sql`SELECT id FROM tasks WHERE calendar_event_id = ${e.id} AND user_id = ${userId}`;
      if (existing.length === 0) {
        const duration = e.start.includes("T")
          ? Math.round((new Date(e.end).getTime() - new Date(e.start).getTime()) / 60000)
          : null;
        await sql`INSERT INTO tasks (title, scheduled_at, duration_minutes, calendar_event_id, status, user_id)
          VALUES (${e.summary}, ${e.start}, ${duration}, ${e.id}, 'pending', ${userId})`;
      }
    }
  } catch {
    // Nicht verbunden — ignorieren
  }

  const todayTasks = await sql`
    SELECT id, title, duration_minutes, scheduled_at, status, calendar_event_id, briefing, goal_id
    FROM tasks
    WHERE status NOT IN ('done', 'skipped') AND scheduled_at >= ${rangeMin} AND scheduled_at <= ${rangeMax} AND user_id = ${userId}
    ORDER BY scheduled_at ASC
  `;

  const cutoff = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const overdueTasks = await sql`
    SELECT id, title, duration_minutes, scheduled_at, status, briefing, goal_id
    FROM tasks
    WHERE status = 'pending' AND scheduled_at < ${rangeMin} AND scheduled_at >= ${cutoff} AND user_id = ${userId}
    ORDER BY scheduled_at DESC
  `;

  const nextTaskRows = await sql`
    SELECT id, title, scheduled_at, duration_minutes, briefing, goal_id
    FROM tasks
    WHERE status = 'pending' AND scheduled_at >= ${now.toISOString()} AND user_id = ${userId}
    ORDER BY scheduled_at ASC
    LIMIT 1
  `;
  const nextTask = nextTaskRows[0] ?? null;

  const goals = await sql`
    SELECT g.id, g.title, g.type, g.deadline,
      COUNT(t.id) as total_tasks,
      SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) as done_tasks
    FROM goals g
    LEFT JOIN tasks t ON t.goal_id = g.id
    WHERE g.status = 'active' AND g.user_id = ${userId}
    GROUP BY g.id, g.title, g.type, g.deadline
    ORDER BY g.created_at DESC
    LIMIT 5
  `;

  return NextResponse.json({ todayTasks, overdueTasks, nextTask, goals });
}
