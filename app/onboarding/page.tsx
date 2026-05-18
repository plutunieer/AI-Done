"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const steps = [
  {
    icon: "👋",
    title: "Willkommen bei AI Done",
    text: "Dein persönlicher KI-Assistent — der nicht nur zuhört, sondern handelt. Erzähl ihm deine Ziele und er plant, priorisiert und setzt um.",
  },
  {
    icon: "📅",
    title: "Dein Kalender. Dein Leben.",
    text: "AI Done kennt deinen Alltag. Er sieht deine bestehenden Termine, berücksichtigt deine Gewohnheiten und findet den richtigen Moment für jede Aufgabe — wie ein persönlicher Assistent, der immer den Überblick behält.",
  },
  {
    icon: "✅",
    title: "Fortschritt der bleibt",
    text: "Nach jeder Session hältst du fest was du erreicht hast. AI Done merkt sich den Kontext, bereitet den nächsten Termin vor und sorgt dafür dass kein Faden verloren geht — auch wenn Wochen vergehen.",
  },
  {
    icon: "🔗",
    title: "Google Kalender verbinden",
    text: "Damit AI Done deinen Alltag wirklich kennt, verbinde deinen Google Kalender. So plant er um bestehende Termine herum — intelligent und ohne Konflikte.",
    isCalendar: true,
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const current = steps[step];
  const isLast = step === steps.length - 1;

  useEffect(() => {
    // Check if came back from Google OAuth
    if (window.location.search.includes("calendar=connected")) {
      setCalendarConnected(true);
      setStep(steps.length - 1);
    }
  }, []);

  useEffect(() => {
    fetch("/api/calendar/status")
      .then((r) => r.json())
      .then((d) => { if (d.connected) setCalendarConnected(true); });
  }, []);

  async function connectCalendar() {
    setConnecting(true);
    const res = await fetch("/api/calendar/auth");
    const { url } = await res.json();
    window.location.href = url;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 flex items-center justify-center px-4">
      <div className="w-full max-w-lg">

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-10">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-300 ${
                i === step ? "w-10 bg-white" : i < step ? "w-5 bg-white/50" : "w-5 bg-white/20"
              }`}
            />
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-10 text-center">
          <div className="text-6xl mb-6">{current.icon}</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">{current.title}</h1>
          <p className="text-gray-500 text-base leading-relaxed mb-10 max-w-sm mx-auto">{current.text}</p>

          {current.isCalendar && (
            <div className="mb-8">
              {calendarConnected ? (
                <div className="flex items-center justify-center gap-2 bg-green-50 text-green-700 rounded-2xl px-5 py-4 text-sm font-semibold">
                  <span>✓</span> Google Kalender verbunden
                </div>
              ) : (
                <button
                  onClick={connectCalendar}
                  disabled={connecting}
                  className="w-full flex items-center justify-center gap-3 border-2 border-gray-100 rounded-2xl px-5 py-4 text-sm font-semibold text-gray-700 hover:border-blue-200 hover:bg-blue-50 transition-all disabled:opacity-50"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  {connecting ? "Verbinden…" : "Mit Google Kalender verbinden"}
                </button>
              )}
            </div>
          )}

          <div className="flex gap-3">
            {step > 0 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="px-6 py-3.5 border-2 border-gray-100 rounded-2xl text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
              >
                Zurück
              </button>
            )}
            <button
              onClick={() => isLast ? router.push("/") : setStep((s) => s + 1)}
              className="flex-1 px-6 py-3.5 bg-blue-500 text-white rounded-2xl text-sm font-semibold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-200"
            >
              {isLast ? "Jetzt loslegen →" : "Weiter →"}
            </button>
          </div>

          {current.isCalendar && !calendarConnected && (
            <button
              onClick={() => router.push("/")}
              className="mt-4 text-xs text-gray-400 hover:text-gray-500 transition-colors"
            >
              Überspringen — später in den Einstellungen verbinden
            </button>
          )}
        </div>

        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mt-8">
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">B</div>
          <span className="text-sm font-semibold text-white/70">AI Done</span>
        </div>
      </div>
    </div>
  );
}
