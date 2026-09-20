"use client";

import { useRef, useState } from "react";
import { Loader2 } from "lucide-react";import { Card, SectionTitle } from "@/components/ui";
import type { Quiz, QuizResult } from "@/lib/types";

type Phase = "idle" | "quiz" | "result";

export default function PracticePage() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [topic, setTopic] = useState("Binary Search");
  const [customTopic, setCustomTopic] = useState("");
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [busy, setBusy] = useState(false);
  const startedAt = useRef<number>(0);

  async function generate(t = topic) {
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: t }),
      });
      const data = (await res.json()) as Quiz;
      setQuiz(data);
      setAnswers({});
      startedAt.current = Date.now();
      setPhase("quiz");
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    if (!quiz) return;
    setBusy(true);
    try {
      const durationMinutes = Math.round((Date.now() - startedAt.current) / 60000);
      const res = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quiz, answers, durationMinutes }),
      });
      const data = (await res.json()) as QuizResult;
      setResult(data);
      setPhase("result");
    } finally {
      setBusy(false);
    }
  }

  const answeredCount = Object.keys(answers).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-wide text-white drop-shadow-sm">
          Practice
        </h1>
        <p className="font-bold text-white/75">
          Adaptive quizzes: every answer updates your mastery map and reshapes the
          next question.
        </p>
      </div>

      {phase === "idle" ? (
        <Card>
          <SectionTitle>Any topic you want</SectionTitle>
          <form
            className="flex flex-col gap-3 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              const t = customTopic.trim();
              if (t) {
                setTopic(t);
                generate(t);
              }
            }}
          >
            <input
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              placeholder="Type any topic: Trigonometry, DBMS normalization, Photosynthesis…"
              className="w-full rounded-full border-2 border-navy/10 bg-white px-5 py-3 font-semibold text-navy outline-none focus:border-coral"
            />
            <button type="submit" disabled={busy || !customTopic.trim()} className="btn-primary whitespace-nowrap disabled:opacity-40">
              Quiz me on it
            </button>
          </form>
          <p className="mt-3 mb-1 text-sm font-extrabold text-navy/50">Or start from a suggested topic:</p>
          <div className="flex flex-wrap gap-2">
            {["Binary Search", "Binary Trees", "Recursion", "Arrays"].map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTopic(t);
                  generate(t);
                }}
                disabled={busy}
                className="btn-secondary text-sm disabled:opacity-40"
              >
                {t}
              </button>
            ))}
          </div>
          <p className="mt-4 text-sm font-semibold text-navy/50">
            Lumi already weights questions toward your weak concepts (boundary
            conditions, we&apos;re looking at you 👀).
          </p>
        </Card>
      ) : null}

      {phase === "quiz" && quiz ? (
        <Card>
          <SectionTitle>
            {quiz.topic} · {answeredCount}/{quiz.questions.length} answered
          </SectionTitle>
          <ol className="space-y-6">
            {quiz.questions.map((q, qi) => (
              <li key={q.id}>
                <p className="mb-3 font-extrabold text-navy">
                  {qi + 1}. {q.question}
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {q.options.map((opt) => {
                    const selected = answers[q.id] === opt;
                    return (
                      <button
                        key={opt}
                        onClick={() => setAnswers((a) => ({ ...a, [q.id]: opt }))}
                        className={`rounded-2xl border-2 px-4 py-2.5 text-left font-semibold transition-colors ${
                          selected
                            ? "border-coral bg-coral/10 text-navy"
                            : "border-navy/10 bg-white text-navy/80 hover:border-navy/30"
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </li>
            ))}
          </ol>
          <button
            onClick={submit}
            disabled={busy || answeredCount < quiz.questions.length}
            className="btn-primary mt-6 disabled:opacity-40"
          >
            {busy ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Checking…
              </span>
            ) : (
              "Submit & diagnose"
            )}
          </button>
        </Card>
      ) : null}

      {phase === "result" && result ? (
        <Card>
          <SectionTitle>Result</SectionTitle>
          <p className="text-5xl font-extrabold text-navy">
            {result.score}
            <span className="text-2xl text-navy/40">/{result.total}</span>
          </p>
          <p className="mt-3 max-w-xl font-bold text-navy/70">{result.recommendation}</p>

          {result.weaknesses.length ? (
            <div className="mt-5 rounded-2xl bg-rose-low/10 p-4">
              <p className="text-xs font-extrabold uppercase tracking-wide text-rose-low">
                Needs attention
              </p>
              <p className="font-semibold text-navy">
                {result.weaknesses.join(" · ")}
              </p>
            </div>
          ) : (
            <div className="mt-5 rounded-2xl bg-lime-ok/10 p-4">
              <p className="text-xs font-extrabold uppercase tracking-wide text-lime-ok">
                Strong
              </p>
              <p className="font-semibold text-navy">
                {result.strengths.join(" · ") || "Everything correct"}
              </p>
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <button onClick={() => generate()} className="btn-primary text-sm">
              Next adaptive set →
            </button>
            <button
              onClick={() => {
                setPhase("idle");
                setQuiz(null);
                setResult(null);
              }}
              className="btn-secondary text-sm"
            >
              Change topic
            </button>
          </div>
        </Card>
      ) : null}
    </div>
  );
}

