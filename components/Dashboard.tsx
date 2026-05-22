"use client";

import { useState, useEffect, useCallback, useMemo } from "react";

type Task = {
  id: number | null;
  title: string;
  duration_minutes: number | null;
  scheduled_at: string | null;
  status: string;
  briefing?: string | null;
  goal_id?: number | null;
  overdue?: boolean;
};

type Goal = {
  id: number;
  title: string;
  type: string;
  deadline: string | null;
  total_tasks: number;
  done_tasks: number;
};

type NextTask = {
  id: number | null;
  title: string;
  scheduled_at: string;
  duration_minutes: number | null;
  briefing?: string | null;
};

const DAYS = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
const MONTHS = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Guten Morgen";
  if (h < 18) return "Guten Tag";
  return "Guten Abend";
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

function formatDuration(minutes: number | null) {
  if (!minutes) return "";
  if (minutes < 60) return `${minutes} Min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

function timeUntil(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff < 0) return "jetzt";
  const m = Math.floor(diff / 60000);
  if (m < 60) return `in ${m} Min`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return rm > 0 ? `in ${h}h ${rm}min` : `in ${h}h`;
}

function CompleteModal({ task, onClose, onDone }: {
  task: Task;
  onClose: () => void;
  onDone: () => void;
}) {
  const [notes, setNotes] = useState("");
  const [briefing, setBriefing] = useState("");
  const [saving, setSaving] = useState(false);
  const [buddyStatus, setBuddyStatus] = useState<string | null>(null);

  async function submit() {
    if (!task.id || !notes.trim()) return;
    setSaving(true);

    // Task abschliessen
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionNotes: notes, nextBriefing: briefing || undefined }),
    });

    setSaving(false);

    if (briefing.trim()) {
      // Only create follow-up when user explicitly specified what to do next
      setBuddyStatus("Buddy plant Follow-up…");
      const prompt = `Task "${task.title}" abgeschlossen.\n\nWas gemacht: ${notes}\n\nFür den nächsten Termin: ${briefing}\n\nBitte erstelle direkt einen Follow-up Termin im Kalender. Antworte kurz.`;
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: prompt }),
        });
        const data = await res.json();
        setBuddyStatus(data.reply ?? null);
        window.dispatchEvent(new CustomEvent("buddy-refresh"));
      } catch {
        setBuddyStatus(null);
      }
      setTimeout(() => onDone(), 3000);
    } else {
      onDone();
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <h3 className="font-semibold text-gray-900 mb-1">Session abschliessen</h3>
        <p className="text-sm text-gray-500 mb-4">{task.title}</p>

        <label className="block text-xs font-medium text-gray-600 mb-1">Was hast du gemacht?</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="z.B. Keywords recherchiert, Meta-Titles für 10 Seiten geschrieben..."
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-black outline-none focus:border-blue-500 resize-none mb-4"
          rows={3}
          autoFocus
        />

        <label className="block text-xs font-medium text-gray-600 mb-1">Was ist für den nächsten Termin wichtig? <span className="text-gray-400">(optional)</span></label>
        <textarea
          value={briefing}
          onChange={(e) => setBriefing(e.target.value)}
          placeholder="z.B. Weiter mit Produktseiten, Bilder noch fehlen, Tool X nutzen..."
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-black outline-none focus:border-blue-500 resize-none mb-6"
          rows={3}
        />

        {buddyStatus && (
          <div className="mb-4 bg-blue-50 rounded-xl px-4 py-3 text-sm text-blue-800">
            <p className="text-xs font-medium text-blue-500 mb-1">Buddy</p>
            {buddyStatus}
          </div>
        )}

        {!buddyStatus && (
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50">
              Abbrechen
            </button>
            <button
              onClick={submit}
              disabled={!notes.trim() || saving}
              className="flex-1 px-4 py-2 text-sm bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-40 transition-colors"
            >
              {saving ? "Speichern…" : "Abschliessen"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

type ViewMode = "day" | "week";

function getWeekStart(d: Date) {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const start = new Date(d);
  start.setDate(d.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

export default function Dashboard() {
  const [mode, setMode] = useState<ViewMode>("day");
  const [offset, setOffset] = useState(0);
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [overdueTasks, setOverdueTasks] = useState<Task[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [nextTask, setNextTask] = useState<NextTask | null>(null);
  const [completing, setCompleting] = useState<Task | null>(null);

  const { from, to, label } = useMemo(() => {
    const base = new Date();
    if (mode === "day") {
      const d = new Date(base);
      d.setDate(d.getDate() + offset);
      const from = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
      const to = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59).toISOString();
      const label = offset === 0 ? "Heute" : offset === 1 ? "Morgen" : offset === -1 ? "Gestern"
        : `${DAYS[d.getDay()]}, ${d.getDate()}. ${MONTHS[d.getMonth()]}`;
      return { from, to, label };
    } else {
      const ws = getWeekStart(base);
      ws.setDate(ws.getDate() + offset * 7);
      const we = new Date(ws);
      we.setDate(ws.getDate() + 6);
      we.setHours(23, 59, 59);
      const fmt = (d: Date) => `${d.getDate()}. ${MONTHS[d.getMonth()].slice(0, 3)}`;
      return {
        from: ws.toISOString(),
        to: we.toISOString(),
        label: `${fmt(ws)} – ${fmt(we)}`,
      };
    }
  }, [mode, offset]);

  const load = useCallback(async () => {
    const res = await fetch(`/api/dashboard?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
    const data = await res.json();
    setTodayTasks(data.todayTasks ?? []);
    setOverdueTasks((data.overdueTasks ?? []).map((t: Task) => ({ ...t, overdue: true })));
    setGoals(data.goals ?? []);
    setNextTask(data.nextTask ?? null);
  }, [from, to]);

  useEffect(() => { load(); }, [load]);

  async function toggleTask(task: Task) {
    if (task.id === null || task.status === "calendar") return;
    if (task.status !== "done") {
      setCompleting(task);
    } else {
      await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "pending" }),
      });
      setTodayTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status: "pending" } : t));
    }
  }

  async function skipTask(task: Task) {
    if (!task.id) return;
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "skipped" }),
    });
    setOverdueTasks((prev) => prev.filter((t) => t.id !== task.id));
    setTodayTasks((prev) => prev.filter((t) => t.id !== task.id));
  }

  async function quickComplete(task: Task) {
    if (!task.id) return;
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "done" }),
    });
    setOverdueTasks((prev) => prev.filter((t) => t.id !== task.id));
    setTodayTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status: "done" } : t));
  }

  async function endOfDay() {
    const prompt = "Tagesabschluss: Schau dir meine heutigen Tasks an. Frage mich was ich erledigt habe und was noch offen ist. Dann hilf mir entscheiden ob offene Tasks verschoben, gelöscht oder für morgen eingeplant werden sollen.";
    await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: prompt }),
    });
    window.dispatchEvent(new CustomEvent("buddy-refresh"));
  }

  const now = new Date();

  return (
    <>
      {completing && (
        <CompleteModal
          task={completing}
          onClose={() => setCompleting(null)}
          onDone={() => { setCompleting(null); load(); }}
        />
      )}

      <div className="flex-1 overflow-y-auto bg-gray-50 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{greeting()} 👋</h1>
            <p className="text-gray-500 text-sm">{`${DAYS[now.getDay()]}, ${now.getDate()}. ${MONTHS[now.getMonth()]} ${now.getFullYear()}`}</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setOffset((o) => o - 1)} className="p-1.5 rounded hover:bg-gray-200 text-gray-500">‹</button>
            <span className="font-semibold text-gray-800 w-40 text-center text-sm">{label}</span>
            <button onClick={() => setOffset((o) => o + 1)} className="p-1.5 rounded hover:bg-gray-200 text-gray-500">›</button>
            <button onClick={() => setOffset(0)} className="px-3 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-50 text-gray-600">Heute</button>
            <div className="flex rounded-lg border border-gray-200 overflow-hidden ml-2">
              {(["day", "week"] as ViewMode[]).map((v) => (
                <button key={v} onClick={() => { setMode(v); setOffset(0); }}
                  className={`px-4 py-1.5 text-sm font-medium transition-colors ${mode === v ? "bg-blue-500 text-white" : "text-gray-600 hover:bg-gray-50"}`}>
                  {v === "day" ? "Tag" : "Woche"}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Nächste Session */}
          {nextTask ? (
            <div className="col-span-3 bg-blue-500 rounded-2xl p-5 text-white">
              <p className="text-blue-100 text-sm mb-1">Nächste Session</p>
              <p className="text-xl font-semibold">{nextTask.title}</p>
              <p className="text-blue-200 text-sm mt-1">
                {formatTime(nextTask.scheduled_at)} Uhr
                {nextTask.duration_minutes ? ` · ${formatDuration(nextTask.duration_minutes)}` : ""}
                {" · "}{timeUntil(nextTask.scheduled_at)}
              </p>
              {nextTask.briefing && (
                <div className="mt-3 bg-white/15 rounded-xl px-4 py-3 text-sm text-white">
                  <p className="text-blue-100 text-xs font-medium mb-1">Kontext vom letzten Termin</p>
                  {nextTask.briefing}
                </div>
              )}
            </div>
          ) : (
            <div className="col-span-3 bg-gray-100 rounded-2xl p-5 text-gray-400 text-center">
              Keine anstehenden Tasks — sag Buddy was du heute erreichen möchtest!
            </div>
          )}

          {/* Überfällige Tasks */}
          {overdueTasks.length > 0 && (
            <div className="col-span-2 bg-white rounded-2xl p-5 border border-orange-200">
              <h2 className="font-semibold text-orange-700 mb-4 flex items-center gap-2">
                <span className="text-base">⚠</span> Überfällig
              </h2>
              <div className="space-y-3">
                {overdueTasks.map((task) => (
                  <div key={task.id} className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{task.title}</p>
                      <p className="text-xs text-orange-400">
                        {task.scheduled_at
                          ? `${new Date(task.scheduled_at).toLocaleDateString("de-DE", { day: "numeric", month: "short" })} · ${formatTime(task.scheduled_at)} Uhr`
                          : "Kein Datum"}
                        {task.duration_minutes ? ` · ${formatDuration(task.duration_minutes)}` : ""}
                      </p>
                      {task.briefing && (
                        <p className="text-xs text-blue-600 mt-1 bg-blue-50 rounded-lg px-2 py-1">
                          💬 {task.briefing}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => quickComplete(task)}
                        className="text-xs text-green-600 font-medium hover:text-green-700 px-2 py-1 rounded hover:bg-green-50 transition-colors"
                      >
                        Erledigt
                      </button>
                      <button
                        onClick={() => skipTask(task)}
                        className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
                      >
                        Überspringen
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Offene Tasks */}
          <div className={`${overdueTasks.length > 0 ? "col-span-2" : "col-span-2"} bg-white rounded-2xl p-5 border border-gray-200`}>
            <h2 className="font-semibold text-gray-900 mb-4">Offene Tasks</h2>
            {todayTasks.length === 0 ? (
              <p className="text-sm text-gray-400">Keine offenen Tasks – gut gemacht!</p>
            ) : (
              <div className="space-y-3">
                {todayTasks.map((task, i) => (
                  <div key={task.id ?? i}>
                    <div className="flex items-start gap-3">
                      {task.status === "calendar" ? (
                        <div className="w-5 h-5 rounded-full border-2 border-blue-300 bg-blue-50 shrink-0 mt-0.5" />
                      ) : (
                        <button
                          onClick={() => toggleTask(task)}
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                            task.status === "done" ? "bg-green-500 border-green-500" : "border-gray-300 hover:border-green-400"
                          }`}
                        >
                          {task.status === "done" && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${task.status === "done" ? "line-through text-gray-400" : "text-gray-900"}`}>
                          {task.title}
                        </p>
                        <p className="text-xs text-gray-400">
                          {task.scheduled_at
                            ? `${new Date(task.scheduled_at).toLocaleDateString("de-DE", { day: "numeric", month: "short" })} · ${formatTime(task.scheduled_at)} Uhr`
                            : "Kein Datum"}
                          {task.duration_minutes ? ` · ${formatDuration(task.duration_minutes)}` : ""}
                        </p>
                        {task.briefing && (
                          <p className="text-xs text-blue-600 mt-1 bg-blue-50 rounded-lg px-2 py-1">
                            💬 {task.briefing}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => skipTask(task)}
                        className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded hover:bg-gray-100 transition-colors shrink-0"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Aktive Ziele */}
          <div className="bg-white rounded-2xl p-5 border border-gray-200">
            <h2 className="font-semibold text-gray-900 mb-4">Aktive Ziele</h2>
            {goals.length === 0 ? (
              <p className="text-sm text-gray-400">Noch keine Ziele gesetzt.</p>
            ) : (
              <div className="space-y-4">
                {goals.map((goal) => {
                  const progress = goal.total_tasks > 0
                    ? Math.round((goal.done_tasks / goal.total_tasks) * 100)
                    : 0;
                  return (
                    <div key={goal.id}>
                      <div className="flex items-start justify-between mb-1">
                        <p className="text-sm font-medium text-gray-900 leading-tight">{goal.title}</p>
                        <span className="text-xs text-gray-400 ml-2 shrink-0">{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
                      </div>
                      {goal.deadline && (
                        <p className="text-xs text-gray-400 mt-1">
                          Deadline: {new Date(goal.deadline).toLocaleDateString("de-DE")}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          {/* Tagesabschluss */}
          <div className="col-span-3 border border-gray-200 rounded-2xl p-5 bg-white flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900 text-sm">Tag abschliessen</p>
              <p className="text-xs text-gray-400 mt-0.5">Buddy fragt dich was noch offen ist und plant es ein</p>
            </div>
            <button
              onClick={endOfDay}
              className="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors shrink-0 ml-4"
            >
              Tagesabschluss →
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
