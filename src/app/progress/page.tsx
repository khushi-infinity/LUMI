import { Flame, TrendingUp, AlertCircle } from "lucide-react";
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

/** GitHub-style calendar heatmap of learning activity (spec §27). */
function StreakCalendar({ streak }: { streak: number }) {
  const today = new Date();
  const days = Array.from({ length: 28 }, (_, i) => {
    const d = new Date(today.getTime() - (27 - i) * 86_400_000);
    // Demo pattern: most recent `streak` days active, with a couple of gaps early.
    const active = i >= 28 - streak && (i !== 28 - streak || streak > 20);
    const level = active ? (i % 5 === 0 ? 2 : 1) : 0;
    return { d, level };
  });
  const weeks: typeof days[] = [];
  for (let i = 0; i < 28; i += 7) weeks.push(days.slice(i, i + 7));

  const LEVEL_BG = ["bg-navy/10", "bg-lime-ok/70", "bg-lime-ok"];

  return (
    <div>
      <div className="flex gap-1.5">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1.5">
            {week.map(({ d, level }) => (
              <div
                key={d.toISOString()}
                title={`${d.toDateString()}${level ? " · learned" : ""}`}
                className={`h-6 w-6 rounded-md ${LEVEL_BG[level]} ${
                  level === 0 ? "" : "shadow-sm"
                }`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-navy/40">
        <span>4 weeks ago</span>
        <div className="flex gap-1">
          {LEVEL_BG.map((c) => (
            <span key={c} className={`h-2.5 w-2.5 rounded-sm ${c}`} />
          ))}
        </div>
        <span>today</span>
      </div>
    </div>
  );
}

export default async function ProgressPage() {
  const [profile, mastery, plan, events] = await Promise.all([
    demoStore.getProfile(),
    demoStore.getMastery(),
    demoStore.getPlan(),
    demoStore.getEvents(12),
  ]);

  const weak = mastery
    .filter((m) => masteryState(m.mastery_score) === "weak")
    .sort((a, b) => a.mastery_score - b.mastery_score) as ConceptMastery[];

  const avg =
    mastery.reduce((acc, m) => acc + m.mastery_score, 0) / (mastery.length || 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-wide text-white drop-shadow-sm">
          Progress
        </h1>
        <p className="font-bold text-white/75">
          Lumi doesn&apos;t just answer; it models how you learn. This is that model.
        </p>
      </div>

      {/* Stat tiles */}
      <div className="grid gap-5 sm:grid-cols-3">
        <Card className="flex items-center gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-coral/15">
            <Flame className="h-7 w-7 text-coral-deep" aria-hidden />
          </span>
          <div>
            <p className="text-3xl font-black text-navy">{profile.streak}</p>
            <p className="text-xs font-bold uppercase tracking-wider text-navy/50">
              day streak
            </p>
          </div>
        </Card>
        <Card>
          <div className="mb-2 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-navy/60" aria-hidden />
            <p className="text-xs font-bold uppercase tracking-wider text-navy/50">
              average mastery
            </p>
          </div>
          <p className="text-3xl font-black text-navy">{Math.round(avg * 100)}%</p>
          <div className="mt-2">
            <ProgressBar percent={avg * 100} />
          </div>
        </Card>
        <Card>
          <div className="mb-2 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-rose-low" aria-hidden />
            <p className="text-xs font-bold uppercase tracking-wider text-navy/50">
              needs attention
            </p>
          </div>
          <p className="text-3xl font-black text-navy">{weak.length}</p>
          {weak[0] ? (
            <p className="mt-1 truncate text-sm font-extrabold text-rose-low">
              Weakest: {weak[0].label} ({Math.round(weak[0].mastery_score * 100)}%)
            </p>
          ) : null}
        </Card>
      </div>

      {/* Streak calendar */}
      <Card>
        <SectionTitle>Learning calendar</SectionTitle>
        <StreakCalendar streak={profile.streak} />
      </Card>

      {/* Knowledge graph */}
      <Card>
        <SectionTitle>Knowledge graph</SectionTitle>
        <KnowledgeGraph mastery={mastery} />
      </Card>

      <div className="grid gap-5 md:grid-cols-2">
        {/* Mastery detail */}
        <Card>
          <SectionTitle>Concept mastery</SectionTitle>
          <ul className="space-y-3.5">
            {[...mastery]
              .sort((a, b) => a.mastery_score - b.mastery_score)
              .map((m) => {
                const state = masteryState(m.mastery_score);
                return (
                  <li key={m.concept} className="flex items-center gap-3">
                    <span aria-hidden className="text-base">
                      {DOT[state]}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between text-sm font-extrabold text-navy">
                        <span className="truncate">{m.label}</span>
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

        {/* Recent activity */}
        <Card>
          <SectionTitle>Recent activity</SectionTitle>
          <ul className="space-y-2.5">
            {events.length === 0 ? (
              <li className="font-semibold text-navy/50">
                Start learning and events land here: every quiz, scan, and focus
                session feeds the model.
              </li>
            ) : (
              events.map((e, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between gap-3 rounded-xl bg-navy/5 px-3 py-2"
                >
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-navy/60">
                    {e.type.replace(/_/g, " ")}
                  </span>
                  <span className="truncate text-sm font-semibold text-navy/80">
                    {e.detail}
                  </span>
                </li>
              ))
            )}
          </ul>
        </Card>
      </div>
    </div>
  );
}
