import Anthropic from "@anthropic-ai/sdk";
import { getDb } from "./db";
import {
  getCalendarEvents,
  createCalendarEvent,
  deleteCalendarEvent,
} from "./calendar";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export type Message = { role: "user" | "assistant"; content: string };

async function getSystemPrompt(userId: number): Promise<string> {
  const now = new Date().toISOString();
  const sql = getDb();

  const rows = await sql`
    SELECT title, briefing, scheduled_at
    FROM tasks
    WHERE status = 'pending' AND scheduled_at >= ${now} AND user_id = ${userId}
    ORDER BY scheduled_at ASC
    LIMIT 1
  `;
  const nextTask = rows[0] as { title: string; briefing: string | null; scheduled_at: string } | undefined;

  const briefingSection = nextTask?.briefing
    ? `\n\nKONTEXT FÜR NÄCHSTE SESSION:\nTask: "${nextTask.title}"\nBriefing vom letzten Termin: ${nextTask.briefing}\nBerücksichtige diesen Kontext wenn der Nutzer über diesen Task spricht.`
    : "";

  return `Du bist Buddy, ein persönlicher AI-Coach. Heute ist ${now}.

Deine Persönlichkeit: Du denkst selbst, handelst direkt und fragst nicht um Erlaubnis. Du bist wie ein erfahrener Chief of Staff — du bekommst eine Aufgabe und erledigst sie, dann meldest du kurz was du gemacht hast.

WICHTIGSTE REGEL: Handle sofort. Frag nicht "Soll ich?", "Darf ich?", "Bist du sicher?". Triff Entscheidungen selbst und teile nur das Ergebnis mit.

Konkret:
- Ziel/Projekt genannt → Schaue sofort in den Kalender, erstelle einen realistischen Plan, speichere alles, melde kurz was erstellt wurde.
- Termin gewünscht → Schaue Kalender, wähle besten Slot, erstelle Event direkt, sage wann du es eingetragen hast.
- Task erledigt → Rufe complete_task auf, erstelle wenn nötig direkt den nächsten Termin.
- Unklare Info → Triff die beste Annahme, handle, erwähne kurz was du angenommen hast.
- Verschieben → Mach es einfach.

Nur fragen wenn wirklich kritisch: z.B. welches Datum wenn der Nutzer gar nichts gesagt hat und kein Kontext existiert.

Format: Kurze, direkte Antworten. Kein Aufzählen von Optionen. Kein "Ich könnte...". Sag was du getan hast.${briefingSection}`;
}

const tools: Anthropic.Messages.Tool[] = [
  {
    name: "get_calendar_events",
    description: "Liest Google Calendar Events in einem Zeitraum. Gibt belegte Zeiten zurück.",
    input_schema: {
      type: "object" as const,
      properties: {
        timeMin: { type: "string", description: "Start des Zeitraums als ISO 8601 string" },
        timeMax: { type: "string", description: "Ende des Zeitraums als ISO 8601 string" },
      },
      required: ["timeMin", "timeMax"],
    },
  },
  {
    name: "create_calendar_event",
    description: "Erstellt einen Google Calendar Event. Direkt ausführen ohne Rückfrage.",
    input_schema: {
      type: "object" as const,
      properties: {
        title: { type: "string", description: "Titel des Events" },
        startISO: { type: "string", description: "Startzeit als ISO 8601 string" },
        durationMinutes: { type: "number", description: "Dauer in Minuten" },
        taskId: { type: "number", description: "Optionale Task-ID um den Event zu verknüpfen" },
      },
      required: ["title", "startISO", "durationMinutes"],
    },
  },
  {
    name: "delete_calendar_event",
    description: "Löscht einen Google Calendar Event (z.B. beim Verschieben).",
    input_schema: {
      type: "object" as const,
      properties: {
        eventId: { type: "string", description: "Google Calendar Event ID" },
      },
      required: ["eventId"],
    },
  },
  {
    name: "save_goal",
    description: "Speichert ein Ziel, Projekt oder einen Task in der Datenbank.",
    input_schema: {
      type: "object" as const,
      properties: {
        title: { type: "string", description: "Titel des Ziels" },
        type: { type: "string", enum: ["goal", "project", "task"], description: "Art des Ziels" },
        deadline: { type: "string", description: "Deadline als ISO 8601 string (optional)" },
      },
      required: ["title", "type"],
    },
  },
  {
    name: "complete_task",
    description: "Schliesst einen Task ab, speichert was gemacht wurde und setzt ein Briefing für den nächsten Task im Projekt.",
    input_schema: {
      type: "object" as const,
      properties: {
        taskId: { type: "number", description: "ID des abgeschlossenen Tasks" },
        sessionNotes: { type: "string", description: "Was wurde in dieser Session gemacht?" },
        nextBriefing: { type: "string", description: "Was muss beim nächsten Termin beachtet werden?" },
        nextTaskId: { type: "number", description: "ID des nächsten Tasks im Projekt (optional)" },
      },
      required: ["taskId", "sessionNotes"],
    },
  },
  {
    name: "save_task",
    description: "Speichert eine einzelne Aufgabe in der Datenbank.",
    input_schema: {
      type: "object" as const,
      properties: {
        goalId: { type: "number", description: "ID des zugehörigen Ziels" },
        title: { type: "string", description: "Titel der Aufgabe" },
        durationMinutes: { type: "number", description: "Dauer in Minuten" },
        scheduledAt: { type: "string", description: "Geplante Zeit als ISO 8601 string" },
        calendarEventId: { type: "string", description: "Google Calendar Event ID" },
      },
      required: ["title"],
    },
  },
];

async function runTool(
  toolName: string,
  input: Record<string, unknown>,
  userId: number
): Promise<unknown> {
  const sql = getDb();

  switch (toolName) {
    case "get_calendar_events":
      return getCalendarEvents(input.timeMin as string, input.timeMax as string, userId);

    case "create_calendar_event": {
      const eventId = await createCalendarEvent(
        input.title as string,
        input.startISO as string,
        input.durationMinutes as number,
        userId
      );
      if (input.taskId) {
        await sql`UPDATE tasks SET calendar_event_id = ${eventId} WHERE id = ${input.taskId as number} AND user_id = ${userId}`;
      }
      return { eventId, success: true };
    }

    case "delete_calendar_event":
      await deleteCalendarEvent(input.eventId as string, userId);
      return { success: true };

    case "complete_task": {
      await sql`UPDATE tasks SET status = 'done', session_notes = ${input.sessionNotes as string} WHERE id = ${input.taskId as number} AND user_id = ${userId}`;
      if (input.nextBriefing) {
        if (input.nextTaskId) {
          await sql`UPDATE tasks SET briefing = ${input.nextBriefing as string} WHERE id = ${input.nextTaskId as number} AND user_id = ${userId}`;
        } else {
          const taskRows = await sql`SELECT goal_id FROM tasks WHERE id = ${input.taskId as number} AND user_id = ${userId}`;
          const currentTask = taskRows[0] as { goal_id: number | null } | undefined;
          if (currentTask?.goal_id) {
            const nextRows = await sql`
              SELECT id FROM tasks
              WHERE goal_id = ${currentTask.goal_id} AND status = 'pending' AND user_id = ${userId}
              ORDER BY scheduled_at ASC, id ASC
              LIMIT 1
            `;
            const next = nextRows[0] as { id: number } | undefined;
            if (next) {
              await sql`UPDATE tasks SET briefing = ${input.nextBriefing as string} WHERE id = ${next.id} AND user_id = ${userId}`;
            }
          }
        }
      }
      return { success: true };
    }

    case "save_goal": {
      const rows = await sql`
        INSERT INTO goals (title, type, deadline, user_id)
        VALUES (${input.title as string}, ${input.type as string}, ${(input.deadline as string) ?? null}, ${userId})
        RETURNING id
      `;
      return { goalId: rows[0].id };
    }

    case "save_task": {
      const rows = await sql`
        INSERT INTO tasks (goal_id, title, duration_minutes, scheduled_at, calendar_event_id, user_id)
        VALUES (
          ${(input.goalId as number) ?? null},
          ${input.title as string},
          ${(input.durationMinutes as number) ?? null},
          ${(input.scheduledAt as string) ?? null},
          ${(input.calendarEventId as string) ?? null},
          ${userId}
        )
        RETURNING id
      `;
      return { taskId: rows[0].id };
    }

    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

export async function chat(history: Message[], userId: number): Promise<string> {
  const messages: Anthropic.Messages.MessageParam[] = history.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const systemPrompt = await getSystemPrompt(userId);

  let response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    system: systemPrompt,
    tools,
    messages,
  });

  while (response.stop_reason === "tool_use") {
    const assistantMessage: Anthropic.Messages.MessageParam = {
      role: "assistant",
      content: response.content,
    };

    const toolResults: Anthropic.Messages.ToolResultBlockParam[] = [];

    for (const block of response.content) {
      if (block.type !== "tool_use") continue;
      try {
        const result = await runTool(block.name, block.input as Record<string, unknown>, userId);
        toolResults.push({ type: "tool_result", tool_use_id: block.id, content: JSON.stringify(result) });
      } catch (err) {
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: `Error: ${err instanceof Error ? err.message : String(err)}`,
          is_error: true,
        });
      }
    }

    messages.push(assistantMessage);
    messages.push({ role: "user", content: toolResults });

    response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: systemPrompt,
      tools,
      messages,
    });
  }

  const textBlock = response.content.find((b) => b.type === "text");
  return textBlock && textBlock.type === "text" ? textBlock.text : "";
}
