"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import Mascot from "@/components/mascot/Mascot";
import { Card } from "@/components/ui";
import type { ExplanationMode } from "@/lib/types";

const MODES: { id: ExplanationMode; label: string }[] = [
  { id: "simple", label: "Simple" },
  { id: "detailed", label: "Detailed" },
  { id: "visual", label: "Visual" },
  { id: "example-first", label: "Example-first" },
  { id: "exam-focused", label: "Exam-focused" },
  { id: "interview-focused", label: "Interview" },
  { id: "socratic", label: "Socratic 🤔" },
];

interface Msg {
  role: "user" | "assistant";
  content: string;
}

/** Tiny markdown renderer: **bold**, `code`, line breaks. */
function RichText({ text }: { text: string }) {
  const html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`(.+?)`/g, '<code class="rounded bg-navy/10 px-1 py-0.5 text-sm">$1</code>')
    .replace(/\n/g, "<br/>");
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

export default function TutorPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<ExplanationMode>("simple");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  async function send(text?: string) {
    const message = (text ?? input).trim();
    if (!message || busy) return;
    setInput("");
    const history = messages.slice(-6);
    setMessages((m) => [...m, { role: "user", content: message }]);
    setBusy(true);
    try {
      const res = await fetch("/api/tutor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, mode, history }),
      });
      const data = (await res.json()) as { reply?: string; error?: string };
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: data.reply ?? data.error ?? "Something went wrong.",
        },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Network hiccup: try again." },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-wide text-white drop-shadow-sm">AI Tutor</h1>
          <p className="font-bold text-white/75">
            Lumi adapts the explanation to how you learn: pick a mode.
          </p>
        </div>
        <Mascot thinking={busy} className="h-32 w-32" />
      </div>

      {/* Mode selector (spec §7–8) */}
      <div className="flex flex-wrap gap-2">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${
              mode === m.id
                ? "bg-navy text-white"
                : "bg-white/70 text-navy hover:bg-white"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {mode === "socratic" && messages.length === 0 ? (
        <Card className="bg-lavender">
          <p className="font-bold text-navy">
            Socratic mode: Lumi won&apos;t hand you answers. It asks, you think,
            and the misunderstanding surfaces early: where it&apos;s cheapest to fix.
          </p>
        </Card>
      ) : null}

      {/* Chat */}
      <Card className="flex min-h-[50vh] flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="grid h-full place-items-center py-10 text-center">
              <div>
                <p className="text-xl font-extrabold text-white/90">
                  Ask anything. Say “I don&apos;t understand this”, that&apos;s enough.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {["Explain recursion", "Why is this O(n²)?", "Teach me eigenvectors"].map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="btn-secondary text-sm"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-3xl px-5 py-3 ${
                    m.role === "user"
                      ? "bg-coral text-white"
                      : "bg-lavender text-navy"
                  }`}
                >
                  <RichText text={m.content} />
                </div>
              </div>
            ))
          )}
          {busy ? (
            <div className="flex items-center gap-2 font-bold text-white/85">
              <span className="inline-block h-2.5 w-2.5 animate-bounce rounded-full bg-coral" />
              Lumi is thinking…
            </div>
          ) : null}
          <div ref={endRef} />
        </div>

        <form
          className="mt-4 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Lumi anything…"
            className="w-full rounded-full border-2 border-navy/10 bg-white px-5 py-3 font-semibold text-navy outline-none focus:border-coral"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="btn-primary grid w-12 place-items-center px-0 disabled:opacity-40"
            aria-label="Send"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </Card>
    </div>
  );
}
