import { Flame } from "lucide-react";
import { KnowledgeGraph } from "@/components/knowledge/KnowledgeGraph";
import { Card, ProgressBar, SectionTitle } from "@/components/ui";
import { demoStore } from "@/lib/memory/demo-store";
import { masteryState } from "@/lib/memory/store";
import type { ConceptMastery } from "@/lib/types";

export const dynamic = "force-dynamic";

const DOT: Record<string, string> = {
  strong: "🟢",
  developing: "🟡",
  weak: "🔴",
};

export default async function ProgressPage() {
  const [profile, mastery, plan, events] = await Promise.all([
    demoStore.getProfile(),
    demoStore.getMastery(),
    demoStore.getPlan(),
    demoStore.getEvents(10),
  ]);

  const weak = mastery
    .filter((m) => masteryState(m.mastery_score) === "weak")
    .sort((a, b) => a.mastery_score - b.mastery_score) as ConceptMastery[];

  const avg =
    mastery.reduce((acc, m) => acc + m.mastery_score, 0) / (mastery.length || 1);

  // Simple 14-day streak heat strip (demo data pattern: last 12 days active).
  const days = Array.from({ length: 14 }, (_, i) => {
    const active = i >= 2;
    return { i, active, label: new Date(Date.now() - (13 - i) * 86_400_000) };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-navy">Progress</h1>
        <p className="font-semibold text-navy/60">
          Lumi doesn&apos;t just answer: it models how you learn. This is that
          model.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid gap-6 sm:grid-cols-3">
        <Card className="flex items-center gap-4">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-coral/15">
            <Flame className="h-7 w-7 text-coral-deep" aria-hidden />
          </span>
          <div>
            <p className="text-3xl font-extrabold text-navy">{profile.streak}</p>
            <p className="text-sm font-bold text-navy/50">day learning streak</p>
          </div>
        </Card>
        <Card>
          <p className="text-3xl font-extrabold text-navy">
            {Math.round(avg * 100)}%
          </p>
          <p className="mb-3 text-sm font-bold text-navy/50">average mastery</p>
          <ProgressBar percent={avg * 100} />
        </Card>
        <Card>
          <p className="text-3xl font-extrabold text-navy">{weak.length}</p>
          <p className="text-sm font-bold text-navy/50">concepts need attention</p>
          {weak[0] ? (
            <p className="mt-2 text-sm font-extrabold text-rose-low">
              Weakest: {weak[0].label}
            </p>
          ) : null}
        </Card>
      </div>

      {/* Knowledge graph */}
      <Card>
        <SectionTitle>Knowledge graph</SectionTitle>
        <KnowledgeGraph mastery={mastery} />
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Mastery detail */}
        <Card>
          <SectionTitle>Concept mastery</SectionTitle>
          <ul className="space-y-3">
            {[...mastery]
              .sort((a, b) => a.mastery_score - b.mastery_score)
              .map((m) => {
                const state = masteryState(m.mastery_score);
                return (
                  <li key={m.concept} className="flex items-center gap-3">
                    <span aria-hidden>{DOT[state]}</span>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm font-extrabold text-navy">
                        <span>{m.label}</span>
                        <span>{Math.round(m.mastery_score * 100)}%</span>
                      </div>
                      <div className="progress-track mt-1 h-2.5">
                        <div
                          className={`h-full rounded-full ${
                            state === "strong"
                              ? "bg-lime-ok"
                              : state === "developing"
                                ? "bg-amber-mid"
                                : "bg-rose-low"
                          }`}
                          style={{ width: `${m.mastery_score * 100}%` }}
                        />
                      </div>
                    </div>
                  </li>
                );
              })}
          </ul>
        </Card>

        {/* Events + streak strip */}
        <Card>
          <SectionTitle>Learning activity</SectionTitle>
          <div className="mb-4 flex gap-1.5">
            {days.map((d) => (
              <div
                key={d.i}
                title={d.label.toDateString()}
                className={`h-9 flex-1 rounded-lg ${
                  d.active ? "bg-coral" : "bg-navy/10"
                }`}
              />
            ))}
          </div>
          <ul className="space-y-2.5">
            {events.length === 0 ? (
              <li className="font-semibold text-navy/40">
                Start learning and events land here: every quiz, scan, and
                focus session feeds the model.
              </li>
            ) : (
              events.map((e, i) => (
                <li key={i} className="flex items-center gap-3 text-sm">
                  <span className="rounded-full bg-lavender px-2.5 py-1 text-[10px] font-extrabold uppercase text-navy/60">
                    {e.type.replace(/_/g, " ")}
                  </span>
                  <span className="font-semibold text-navy/80">{e.detail}</span>
                </li>
              ))
            )}
          </ul>
        </Card>
      </div>
    </div>
  );
}
