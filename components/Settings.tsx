"use client";

import { useState } from "react";

export default function Settings() {
  const [workStart, setWorkStart] = useState("08:00");
  const [workEnd, setWorkEnd] = useState("18:00");
  const [calConnected, setCalConnected] = useState(false);
  const [saving, setSaving] = useState(false);

  async function connectCalendar() {
    const res = await fetch("/api/calendar/auth");
    const { url } = await res.json();
    window.location.href = url;
  }

  async function save() {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Einstellungen</h1>

      <div className="max-w-lg space-y-6">
        {/* Google Calendar */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-1">Google Calendar</h2>
          <p className="text-sm text-gray-500 mb-4">
            Buddy liest deinen Kalender und plant Sessions in freie Zeiten ein.
          </p>
          {calConnected ? (
            <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              Verbunden
            </div>
          ) : (
            <button
              onClick={connectCalendar}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Mit Google verbinden
            </button>
          )}
        </div>

        {/* Arbeitszeiten */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-1">Planungszeiten</h2>
          <p className="text-sm text-gray-500 mb-4">
            Buddy plant Sessions nur innerhalb dieser Zeiten.
          </p>
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Von</label>
              <input
                type="time"
                value={workStart}
                onChange={(e) => setWorkStart(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <span className="text-gray-400 mt-4">–</span>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Bis</label>
              <input
                type="time"
                value={workEnd}
                onChange={(e) => setWorkEnd(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="px-6 py-2.5 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-60"
        >
          {saving ? "Speichern…" : "Speichern"}
        </button>
      </div>
    </div>
  );
}
