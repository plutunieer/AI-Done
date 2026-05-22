"use client";

import { useState, useRef, useEffect, useCallback } from "react";

type Message = { role: "user" | "assistant"; content: string };

export default function Chat() {
  const WELCOME: Message = {
    role: "assistant",
    content:
      "Hey! Ich bin Buddy 👋 Was möchtest du erreichen? Sag mir dein Ziel, dein Projekt, oder einen Task – ich kümmere mich um den Rest.",
  };

  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [voiceSupported, setVoiceSupported] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const pendingVoiceRef = useRef("");

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    if (!SR) setVoiceSupported(false);
  }, []);

  function loadMessages() {
    fetch("/api/chat")
      .then((r) => r.json())
      .then((d) => {
        if (d.messages?.length > 0) setMessages(d.messages);
      });
  }

  useEffect(() => {
    loadMessages();
    window.addEventListener("buddy-refresh", loadMessages);
    return () => window.removeEventListener("buddy-refresh", loadMessages);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(async (text: string) => {
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      const content = data.reply
        ?? (data.error === "overloaded" ? "Buddy ist gerade überlastet — bitte in ein paar Sekunden nochmal versuchen." : data.error ?? "Fehler");
      setMessages((prev) => [...prev, { role: "assistant", content }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Verbindungsfehler. Bitte nochmal versuchen." },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  async function send(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    await sendMessage(text);
  }

  function toggleVoice() {
    if (!voiceSupported) return;

    if (listening) {
      recognitionRef.current?.stop();
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR: any = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = "de-DE";
    rec.continuous = false;
    rec.interimResults = true;
    recognitionRef.current = rec;
    pendingVoiceRef.current = "";

    rec.onstart = () => setListening(true);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      let interimText = "";
      let finalText = "";
      for (const result of Array.from(e.results) as any[]) {
        if (result.isFinal) finalText += result[0].transcript;
        else interimText += result[0].transcript;
      }
      if (finalText) pendingVoiceRef.current = finalText;
      setInterim(interimText || finalText);
    };

    rec.onend = () => {
      setListening(false);
      setInterim("");
      const text = pendingVoiceRef.current.trim();
      pendingVoiceRef.current = "";
      if (text) {
        setInput("");
        sendMessage(text);
      }
    };

    rec.onerror = () => {
      setListening(false);
      setInterim("");
    };

    rec.start();
  }

  const showMic = !input.trim() && !loading;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <h1 className="font-semibold text-gray-900">Chat</h1>
        <p className="text-xs text-gray-400">Schreib oder sprich mit Buddy</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-blue-500 text-white rounded-br-sm"
                  : "bg-white text-gray-800 border border-gray-200 rounded-bl-sm shadow-sm"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1 items-center h-4">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Voice recording indicator */}
      {listening && (
        <div className="px-6 pb-2">
          <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 flex items-center gap-3">
            <div className="flex gap-0.5 items-end shrink-0">
              <span className="w-1 h-3 bg-red-400 rounded-full animate-[bounce_0.5s_ease-in-out_infinite]" />
              <span className="w-1 h-5 bg-red-500 rounded-full animate-[bounce_0.5s_ease-in-out_infinite_0.1s]" />
              <span className="w-1 h-4 bg-red-400 rounded-full animate-[bounce_0.5s_ease-in-out_infinite_0.15s]" />
              <span className="w-1 h-6 bg-red-500 rounded-full animate-[bounce_0.5s_ease-in-out_infinite_0.2s]" />
              <span className="w-1 h-3 bg-red-400 rounded-full animate-[bounce_0.5s_ease-in-out_infinite_0.25s]" />
            </div>
            <span className="text-sm text-red-700 flex-1">
              {interim || "Sprich jetzt…"}
            </span>
            <button
              onClick={toggleVoice}
              className="text-xs text-red-500 font-medium hover:text-red-700"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={send} className="bg-white border-t border-gray-200 px-4 py-3 flex gap-2 items-center">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={listening ? "Aufnahme läuft…" : "Schreib mit Buddy…"}
          disabled={loading || listening}
          className="flex-1 rounded-full border border-gray-300 px-4 py-2.5 text-sm text-black outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50"
        />

        {showMic ? (
          <button
            type="button"
            onClick={toggleVoice}
            disabled={!voiceSupported}
            title={voiceSupported ? "Spracheingabe" : "Spracheingabe nicht unterstützt"}
            className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-all ${
              listening
                ? "bg-red-500 shadow-lg shadow-red-200 scale-110"
                : voiceSupported
                ? "bg-blue-500 hover:bg-blue-600 shadow-md shadow-blue-100"
                : "bg-gray-200 cursor-not-allowed"
            }`}
          >
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.93V20H9v2h6v-2h-2v-2.07A7 7 0 0 0 19 11h-2z"/>
            </svg>
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="w-11 h-11 rounded-full bg-blue-500 flex items-center justify-center disabled:opacity-40 hover:bg-blue-600 transition-colors shrink-0 shadow-md shadow-blue-100"
          >
            <svg className="w-5 h-5 text-white rotate-90" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        )}
      </form>
    </div>
  );
}
