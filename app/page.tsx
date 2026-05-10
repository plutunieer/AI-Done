"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Chat from "@/components/Chat";
import Dashboard from "@/components/Dashboard";
import CalendarView from "@/components/CalendarView";
import Settings from "@/components/Settings";

type View = "chat" | "dashboard" | "calendar" | "settings";

export default function Home() {
  const [view, setView] = useState<View>("chat");

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar active={view} onChange={setView} />
      {view === "chat" && <Chat />}
      {view === "dashboard" && <Dashboard />}
      {view === "calendar" && <CalendarView />}
      {view === "settings" && <Settings />}
    </div>
  );
}
