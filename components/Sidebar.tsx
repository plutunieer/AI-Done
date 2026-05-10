"use client";

import { useRouter } from "next/navigation";

type View = "chat" | "dashboard" | "calendar" | "settings";

const navItems: { id: View; label: string; icon: string }[] = [
  { id: "chat", label: "Chat", icon: "💬" },
  { id: "dashboard", label: "Dashboard", icon: "📊" },
  { id: "calendar", label: "Kalender", icon: "📅" },
  { id: "settings", label: "Einstellungen", icon: "⚙️" },
];

export default function Sidebar({
  active,
  onChange,
}: {
  active: View;
  onChange: (v: View) => void;
}) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="w-56 h-screen bg-white border-r border-gray-200 flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 flex items-center gap-2.5 border-b border-gray-100">
        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
          B
        </div>
        <span className="font-semibold text-gray-900 text-lg">Buddy</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
              active === item.id
                ? "bg-blue-50 text-blue-600"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-gray-100 space-y-1">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors text-left"
        >
          <span className="text-base">↩</span>
          Abmelden
        </button>
        <p className="text-xs text-gray-400 px-3">Buddy MVP · 2026</p>
      </div>
    </aside>
  );
}
