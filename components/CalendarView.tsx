"use client";

import { useState, useEffect, useCallback, useMemo } from "react";

type CalView = "week" | "month" | "year";
type RealEvent = { start: string; end: string; summary: string };

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const MONTHS = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
const MONTHS_SHORT = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
const COLORS = ["bg-blue-500", "bg-purple-500", "bg-orange-500", "bg-green-500", "bg-red-500", "bg-teal-500"];

function colorFor(summary: string) {
  let h = 0;
  for (const c of summary) h = (h << 5) - h + c.charCodeAt(0);
  return COLORS[Math.abs(h) % COLORS.length];
}

function getWeekStart(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  d.setHours(0, 0, 0, 0);
  return d;
}

// All-day events have "YYYY-MM-DD" format — parse as local time to avoid UTC offset shift
function parseStart(dateStr: string): Date {
  if (!dateStr.includes("T")) {
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(dateStr);
}

function isAllDay(e: RealEvent) {
  return !e.start.includes("T");
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function WeekView({ events, weekStart }: { events: RealEvent[]; weekStart: Date }) {
  const today = new Date();
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  const allDayEvents = events.filter(isAllDay);
  const timedEvents = events.filter((e) => !isAllDay(e));

  return (
    <div className="flex-1 overflow-auto">
      {/* Day headers */}
      <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-gray-200 bg-white sticky top-0 z-10">
        <div />
        {weekDays.map((d, i) => {
          const isToday = sameDay(d, today);
          return (
            <div key={i} className="text-center py-3 border-l border-gray-100 first:border-l-0">
              <p className="text-xs text-gray-400 uppercase">{DAYS[i]}</p>
              <div className={`mx-auto mt-1 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${isToday ? "bg-blue-500 text-white" : "text-gray-800"}`}>
                {d.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      {/* All-day row */}
      {allDayEvents.length > 0 && (
        <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-gray-200 bg-gray-50">
          <div className="text-right pr-2 py-1 text-xs text-gray-400 self-center">ganztägig</div>
          {weekDays.map((dayDate, di) => {
            const dayAllDay = allDayEvents.filter((e) => sameDay(parseStart(e.start), dayDate));
            return (
              <div key={di} className="border-l border-gray-100 px-0.5 py-1 space-y-0.5 min-h-[28px]">
                {dayAllDay.map((e, ei) => (
                  <div key={ei} className={`${colorFor(e.summary)} text-white text-xs rounded px-1.5 py-0.5 truncate`}>
                    {e.summary}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* Time grid */}
      <div className="grid grid-cols-[56px_repeat(7,1fr)]">
        {HOURS.map((h) => (
          <div key={h} className="contents">
            <div className="text-right pr-2 pt-1 text-xs text-gray-400 border-t border-gray-100">
              {h}:00
            </div>
            {weekDays.map((dayDate, di) => {
              const dayEvents = timedEvents.filter((e) => {
                const s = parseStart(e.start);
                return sameDay(s, dayDate) && s.getHours() === h;
              });
              return (
                <div key={di} className="border-t border-l border-gray-100 h-14 relative">
                  {dayEvents.map((e, ei) => {
                    const duration = (new Date(e.end).getTime() - new Date(e.start).getTime()) / 3600000;
                    return (
                      <div
                        key={ei}
                        className={`absolute inset-x-0.5 top-0.5 ${colorFor(e.summary)} text-white text-xs rounded px-1.5 py-0.5 overflow-hidden`}
                        style={{ height: `${Math.max(duration, 0.5) * 56 - 4}px` }}
                      >
                        {e.summary}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function MonthView({ year, month, events }: { year: number; month: number; events: RealEvent[] }) {
  const firstDay = new Date(year, month, 1).getDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const cells = Array.from({ length: offset + daysInMonth }, (_, i) =>
    i < offset ? null : i - offset + 1
  );
  while (cells.length % 7 !== 0) cells.push(null);

  const eventsByDay = new Map<number, RealEvent[]>();
  for (const e of events) {
    const d = parseStart(e.start);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      if (!eventsByDay.has(day)) eventsByDay.set(day, []);
      eventsByDay.get(day)!.push(e);
    }
  }

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="grid grid-cols-7 mb-2">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-gray-400 uppercase py-2">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-xl overflow-hidden">
        {cells.map((day, i) => {
          const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
          const dayEvents = day ? (eventsByDay.get(day) ?? []) : [];
          return (
            <div key={i} className="bg-white min-h-[80px] p-2">
              {day && (
                <>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm mb-1 ${isToday ? "bg-blue-500 text-white font-semibold" : "text-gray-700"}`}>
                    {day}
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.map((e, ei) => (
                      <div key={ei} className={`${colorFor(e.summary)} text-white text-xs rounded px-1.5 py-0.5 truncate`}>
                        {e.summary}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function YearView({ year, events }: { year: number; events: RealEvent[] }) {
  const today = new Date();

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="grid grid-cols-4 gap-6">
        {MONTHS.map((monthName, m) => {
          const firstDay = new Date(year, m, 1).getDay();
          const offset = firstDay === 0 ? 6 : firstDay - 1;
          const daysInMonth = new Date(year, m + 1, 0).getDate();
          const cells = Array.from({ length: offset + daysInMonth }, (_, i) =>
            i < offset ? null : i - offset + 1
          );
          while (cells.length % 7 !== 0) cells.push(null);

          const eventDays = new Set(
            events
              .filter((e) => {
                const d = parseStart(e.start);
                return d.getFullYear() === year && d.getMonth() === m;
              })
              .map((e) => parseStart(e.start).getDate())
          );

          return (
            <div key={m} className="bg-white rounded-xl border border-gray-200 p-3">
              <p className={`text-sm font-semibold mb-2 ${eventDays.size > 0 ? "text-blue-600" : "text-gray-800"}`}>{monthName}</p>
              <div className="grid grid-cols-7 gap-px">
                {["M", "D", "M", "D", "F", "S", "S"].map((d, i) => (
                  <div key={i} className="text-center text-[10px] text-gray-400">{d}</div>
                ))}
                {cells.map((day, i) => {
                  const isToday = day === today.getDate() && m === today.getMonth() && year === today.getFullYear();
                  const hasEvent = day ? eventDays.has(day) : false;
                  return (
                    <div
                      key={i}
                      className={`text-center text-[11px] rounded-full w-5 h-5 flex items-center justify-center mx-auto ${
                        isToday ? "bg-blue-500 text-white font-bold"
                        : hasEvent ? "bg-blue-100 text-blue-700 font-medium"
                        : day ? "text-gray-600 hover:bg-gray-100"
                        : ""
                      }`}
                    >
                      {day}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function CalendarView() {
  const [view, setView] = useState<CalView>("week");
  const today = useMemo(() => new Date(), []);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [weekOffset, setWeekOffset] = useState(0);
  const [connected, setConnected] = useState<boolean | null>(null);
  const [events, setEvents] = useState<RealEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const weekStart = useMemo(() => {
    const base = getWeekStart(today);
    base.setDate(base.getDate() + weekOffset * 7);
    return base;
  }, [today, weekOffset]);

  useEffect(() => {
    fetch("/api/calendar/status")
      .then((r) => r.json())
      .then((d) => setConnected(d.connected));
  }, []);

  const fetchEvents = useCallback(async () => {
    if (!connected) return;
    setLoadingEvents(true);
    setFetchError(null);
    try {
      let timeMin: Date, timeMax: Date;
      if (view === "week") {
        timeMin = new Date(weekStart);
        timeMax = new Date(weekStart);
        timeMax.setDate(weekStart.getDate() + 7);
      } else if (view === "month") {
        timeMin = new Date(year, month, 1);
        timeMax = new Date(year, month + 1, 0, 23, 59, 59);
      } else {
        timeMin = new Date(year, 0, 1);
        timeMax = new Date(year, 11, 31, 23, 59, 59);
      }
      const res = await fetch(`/api/calendar/events?timeMin=${timeMin.toISOString()}&timeMax=${timeMax.toISOString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Fehler");
      setEvents(data.events ?? []);
    } catch (e: unknown) {
      setFetchError(e instanceof Error ? e.message : "Unbekannter Fehler");
    } finally {
      setLoadingEvents(false);
    }
  }, [connected, view, year, month, weekStart]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  async function connect() {
    const res = await fetch("/api/calendar/auth");
    const { url } = await res.json();
    window.location.href = url;
  }

  function prev() {
    if (view === "week") setWeekOffset((o) => o - 1);
    else if (view === "month") {
      if (month === 0) { setMonth(11); setYear((y) => y - 1); }
      else setMonth((m) => m - 1);
    } else setYear((y) => y - 1);
  }
  function next() {
    if (view === "week") setWeekOffset((o) => o + 1);
    else if (view === "month") {
      if (month === 11) { setMonth(0); setYear((y) => y + 1); }
      else setMonth((m) => m + 1);
    } else setYear((y) => y + 1);
  }
  function goToday() {
    setWeekOffset(0);
    setYear(today.getFullYear());
    setMonth(today.getMonth());
  }

  function weekLabel() {
    const end = new Date(weekStart);
    end.setDate(weekStart.getDate() + 6);
    const fmt = (d: Date) => `${d.getDate()}. ${MONTHS_SHORT[d.getMonth()]}`;
    return `${fmt(weekStart)} – ${fmt(end)}`;
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={prev} className="p-1.5 rounded hover:bg-gray-100 text-gray-500">‹</button>
          <span className="font-semibold text-gray-900 w-52 text-center">
            {view === "week" ? weekLabel() : view === "year" ? year : `${MONTHS[month]} ${year}`}
          </span>
          <button onClick={next} className="p-1.5 rounded hover:bg-gray-100 text-gray-500">›</button>
          <button onClick={goToday} className="ml-2 px-3 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-50 text-gray-600">
            Heute
          </button>
        </div>

        <div className="flex items-center gap-3">
          {connected === false && (
            <button onClick={connect} className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
              Mit Google verbinden
            </button>
          )}
          {connected === true && <span className="text-xs text-green-600 font-medium">● Verbunden</span>}
          {loadingEvents && <span className="text-xs text-gray-400">Lade…</span>}
          {fetchError && <span className="text-xs text-red-500">{fetchError}</span>}

          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            {(["week", "month", "year"] as CalView[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-1.5 text-sm font-medium transition-colors ${view === v ? "bg-blue-500 text-white" : "text-gray-600 hover:bg-gray-50"}`}
              >
                {v === "week" ? "Woche" : v === "month" ? "Monat" : "Jahr"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {connected === false ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-4xl mb-4">📅</p>
            <p className="text-gray-700 font-medium mb-1">Kalender noch nicht verbunden</p>
            <p className="text-sm text-gray-400 mb-6">Verbinde deinen Google Calendar, um Events zu sehen</p>
            <button onClick={connect} className="px-5 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium">
              Mit Google Calendar verbinden
            </button>
          </div>
        </div>
      ) : connected === true ? (
        <>
          {view === "week" && <WeekView events={events} weekStart={weekStart} />}
          {view === "month" && <MonthView year={year} month={month} events={events} />}
          {view === "year" && <YearView year={year} events={events} />}
        </>
      ) : null}
    </div>
  );
}
