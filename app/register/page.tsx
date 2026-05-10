"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-sm">
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">B</div>
          <span className="font-semibold text-gray-900 text-xl">Buddy</span>
        </div>

        <h1 className="text-xl font-bold text-gray-900 mb-1">Konto erstellen</h1>
        <p className="text-sm text-gray-500 mb-6">Starte mit deinem persönlichen Coach</p>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Dein Name" autoFocus
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-black outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="du@beispiel.de" required
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-black outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Passwort</label>
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Mind. 8 Zeichen" required minLength={8}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-black outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit" disabled={loading}
            className="w-full bg-blue-500 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors"
          >
            {loading ? "Konto erstellen…" : "Konto erstellen"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Bereits registriert?{" "}
          <Link href="/login" className="text-blue-500 hover:underline font-medium">Anmelden</Link>
        </p>
      </div>
    </div>
  );
}
