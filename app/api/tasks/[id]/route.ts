import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { userId } = session;

  const { id } = await params;
  const body = await req.json();
  const sql = getDb();
  const taskId = Number(id);

  if (body.sessionNotes !== undefined || body.nextBriefing !== undefined) {
    await sql`UPDATE tasks SET status = 'done', session_notes = ${body.sessionNotes ?? null} WHERE id = ${taskId} AND user_id = ${userId}`;

    if (body.nextBriefing) {
      if (body.nextTaskId) {
        await sql`UPDATE tasks SET briefing = ${body.nextBriefing} WHERE id = ${body.nextTaskId} AND user_id = ${userId}`;
      } else {
        const taskRows = await sql`SELECT goal_id FROM tasks WHERE id = ${taskId} AND user_id = ${userId}`;
        const task = taskRows[0] as { goal_id: number | null } | undefined;
        if (task?.goal_id) {
          const nextRows = await sql`
            SELECT id FROM tasks
            WHERE goal_id = ${task.goal_id} AND status = 'pending' AND user_id = ${userId}
            ORDER BY scheduled_at ASC, id ASC
            LIMIT 1
          `;
          const next = nextRows[0] as { id: number } | undefined;
          if (next) {
            await sql`UPDATE tasks SET briefing = ${body.nextBriefing} WHERE id = ${next.id} AND user_id = ${userId}`;
          }
        }
      }
    }
  } else {
    await sql`UPDATE tasks SET status = ${body.status} WHERE id = ${taskId} AND user_id = ${userId}`;
  }

  return NextResponse.json({ success: true });
}
