"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Dashboard from "@/components/Dashboard";
import Settings from "@/components/Settings";

type Tab = "heute" | "woche" | "monat";
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

function parseStart(dateStr: string): Date {
  if (!dateStr.includes("T")) {
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(dateStr);
}

function isAllDay(e: RealEvent) { return !e.start.includes("T"); }

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
      <div className="grid grid-cols-[40px_repeat(7,1fr)] border-b border-gray-200 bg-white sticky top-0 z-10">
        <div />
        {weekDays.map((d, i) => {
          const isToday = sameDay(d, today);
          return (
            <div key={i} className="text-center py-2 border-l border-gray-100 first:border-l-0">
              <p className="text-[10px] text-gray-400 uppercase">{DAYS[i]}</p>
              <div className={`mx-auto mt-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${isToday ? "bg-blue-500 text-white" : "text-gray-800"}`}>
                {d.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      {allDayEvents.length > 0 && (
        <div className="grid grid-cols-[40px_repeat(7,1fr)] border-b border-gray-200 bg-gray-50">
          <div className="text-right pr-1 py-1 text-[10px] text-gray-400 self-center">ganz</div>
          {weekDays.map((dayDate, di) => {
            const dayAllDay = allDayEvents.filter((e) => sameDay(parseStart(e.start), dayDate));
            return (
              <div key={di} className="border-l border-gray-100 px-0.5 py-1 space-y-0.5 min-h-[24px]">
                {dayAllDay.map((e, ei) => (
                  <div key={ei} className={`${colorFor(e.summary)} text-white text-[10px] rounded px-1 py-0.5 truncate`}>
                    {e.summary}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-[40px_repeat(7,1fr)]">
        {HOURS.map((h) => (
          <div key={h} className="contents">
            <div className="text-right pr-1 pt-1 text-[10px] text-gray-400 border-t border-gray-100">{h}:00</div>
            {weekDays.map((dayDate, di) => {
              const dayEvents = timedEvents.filter((e) => {
                const s = parseStart(e.start);
                return sameDay(s, dayDate) && s.getHours() === h;
              });
              return (
                <div key={di} className="border-t border-l border-gray-100 h-12 relative">
                  {dayEvents.map((e, ei) => {
                    const duration = (new Date(e.end).getTime() - new Date(e.start).getTime()) / 3600000;
                    return (
                      <div
                        key={ei}
                        className={`absolute inset-x-0.5 top-0.5 ${colorFor(e.summary)} text-white text-[10px] rounded px-1 py-0.5 overflow-hidden`}
                        style={{ height: `${Math.max(duration, 0.5) * 48 - 4}px` }}
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

  const cells = Array.from({ length: offset + daysInMonth }, (_, i) => i < offset ? null : i - offset + 1);
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
    <div className="flex-1 overflow-auto p-4">
      <div className="grid grid-cols-7 mb-2">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-gray-400 uppercase py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-xl overflow-hidden">
        {cells.map((day, i) => {
          const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
          const dayEvents = day ? (eventsByDay.get(day) ?? []) : [];
          return (
            <div key={i} className="bg-white min-h-[64px] p-1.5">
              {day && (
                <>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs mb-1 ${isToday ? "bg-blue-500 text-white font-semibold" : "text-gray-700"}`}>
                    {day}
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 2).map((e, ei) => (
                      <div key={ei} className={`${colorFor(e.summary)} text-white text-[10px] rounded px-1 py-0.5 truncate`}>
                        {e.summary}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-[10px] text-gray-400">+{dayEvents.length - 2}</div>
                    )}
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

export default function SmartPanel() {
  const [tab, setTab] = useState<Tab>("heute");
  const [showSettings, setShowSettings] = useState(false);
  const today = useMemo(() => new Date(), []);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [weekOffset, setWeekOffset] = useState(0);
  const [connected, setConnected] = useState<boolean | null>(null);
  const [events, setEvents] = useState<RealEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  const weekStart = useMemo(() => {
    const base = getWeekStart(today);
    base.setDate(base.getDate() + weekOffset * 7);
    return base;
  }, [today, weekOffset]);

  useEffect(() => {
    fetch("/api/calendar/status").then(r => r.json()).then(d => setConnected(d.connected));
  }, []);

  const fetchEvents = useCallback(async () => {
    if (!connected) return;
    setLoadingEvents(true);
    try {
      let timeMin: Date, timeMax: Date;
      if (tab === "woche") {
        timeMin = new Date(weekStart);
        timeMax = new Date(weekStart);
        timeMax.setDate(weekStart.getDate() + 7);
      } else {
        timeMin = new Date(year, month, 1);
        timeMax = new Date(year, month + 1, 0, 23, 59, 59);
      }
      const res = await fetch(`/api/calendar/events?timeMin=${timeMin.toISOString()}&timeMax=${timeMax.toISOString()}`);
      const data = await res.json();
      setEvents(data.events ?? []);
    } finally {
      setLoadingEvents(false);
    }
  }, [connected, tab, year, month, weekStart]);

  useEffect(() => {
    if (tab === "woche" || tab === "monat") fetchEvents();
  }, [fetchEvents, tab]);

  function weekLabel() {
    const end = new Date(weekStart);
    end.setDate(weekStart.getDate() + 6);
    const fmt = (d: Date) => `${d.getDate()}. ${MONTHS_SHORT[d.getMonth()]}`;
    return `${fmt(weekStart)} – ${fmt(end)}`;
  }

  async function connect() {
    const res = await fetch("/api/calendar/auth");
    const { url } = await res.json();
    window.location.href = url;
  }

  function prev() {
    if (tab === "woche") setWeekOffset(o => o - 1);
    else if (tab === "monat") {
      if (month === 0) { setMonth(11); setYear(y => y - 1); }
      else setMonth(m => m - 1);
    }
  }

  function next() {
    if (tab === "woche") setWeekOffset(o => o + 1);
    else if (tab === "monat") {
      if (month === 11) { setMonth(0); setYear(y => y + 1); }
      else setMonth(m => m + 1);
    }
  }

  function goToday() {
    setWeekOffset(0);
    setYear(today.getFullYear());
    setMonth(today.getMonth());
  }

  const showCalNav = tab === "woche" || tab === "monat";

  return (
    <div className="w-1/2 flex flex-col overflow-hidden border-l border-gray-200">
      {/* Header bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex gap-1">
          {(["heute", "woche", "monat"] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${tab === t ? "bg-blue-500 text-white" : "text-gray-500 hover:bg-gray-100"}`}
            >
              {t === "heute" ? "Heute" : t === "woche" ? "Woche" : "Monat"}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          {showCalNav && (
            <>
              <button onClick={prev} className="p-1 rounded hover:bg-gray-100 text-gray-500 text-lg leading-none">‹</button>
              <span className="text-sm font-medium text-gray-700 w-36 text-center">
                {tab === "woche" ? weekLabel() : `${MONTHS[month]} ${year}`}
              </span>
              <button onClick={next} className="p-1 rounded hover:bg-gray-100 text-gray-500 text-lg leading-none">›</button>
              <button onClick={goToday} className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 text-gray-600 ml-1">Heute</button>
            </>
          )}
          {loadingEvents && <span className="text-xs text-gray-400 ml-1">Lade…</span>}
          {connected === false && (
            <button
              onClick={connect}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors ml-1"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Kalender verbinden
            </button>
          )}
          {connected === true && (
            <span className="text-xs text-green-600 font-medium ml-1">● Verbunden</span>
          )}
          <button
            onClick={() => setShowSettings(true)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 ml-1"
            title="Einstellungen"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Tab content */}
      {tab === "heute" && <Dashboard />}

      {(tab === "woche" || tab === "monat") && connected === false && (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <p className="text-4xl mb-4">📅</p>
            <p className="text-gray-700 font-medium mb-1">Kalender nicht verbunden</p>
            <p className="text-sm text-gray-400 mb-4">Verbinde deinen Google Kalender um Events zu sehen</p>
            <button onClick={connect} className="px-4 py-2 bg-blue-500 text-white rounded-xl text-sm hover:bg-blue-600 transition-colors">
              Mit Google verbinden
            </button>
          </div>
        </div>
      )}

      {tab === "woche" && connected === true && <WeekView events={events} weekStart={weekStart} />}
      {tab === "monat" && connected === true && <MonthView year={year} month={month} events={events} />}

      {/* Settings modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <h2 className="font-semibold text-gray-900">Einstellungen</h2>
              <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
            </div>
            <div className="overflow-y-auto flex-1">
              <Settings />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
