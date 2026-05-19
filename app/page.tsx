"use client";

import Chat from "@/components/Chat";
import SmartPanel from "@/components/SmartPanel";

export default function Home() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Chat />
      <SmartPanel />
    </div>
  );
}
