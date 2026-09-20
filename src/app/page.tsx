import Link from "next/link";
import { Clock, Play, Target, BookOpen } from "lucide-react";
import Mascot from "@/components/mascot/Mascot";
import { Card, PlanList, ProgressBar, SectionTitle } from "@/components/ui";
import { demoStore } from "@/lib/memory/demo-store";

export const dynamic = "force-dynamic";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

/** "Crack the DSA midterm in 10 days" → display title "DSA / &MIDTERM". */
function missionTitle(goal: string): [string, string] {
  const cleaned = goal
    .replace(/\bin\s+\d+\s+days?/i, "")
    .replace(/crack the /i, "")
    .replace(/\s+/g, " ")
    .trim();
  const words = cleaned.split(" ").filter(Boolean);
  const mid = Math.max(1, Math.floor(words.length / 2));
  return [
    words.slice(0, mid).join(" ").toUpperCase(),
    "&" + words.slice(mid).join(" ").toUpperCase(),
  ];
}

function Cloud({ className }: { className: string }) {
  return (
    <div className={`cloud ${className}`} aria-hidden>
      <div className="relative h-16 w-28 rounded-full bg-white/90">
        <div className="absolute -top-6 left-5 h-12 w-12 rounded-full bg-white/90" />
        <div className="absolute -top-4 left-14 h-9 w-9 rounded-full bg-white/90" />
      </div>
    </div>
  );
}

export default async function HomePage() {
  const [profile, plan] = await Promise.all([
    demoStore.getProfile(),
    demoStore.getPlan(),
  ]);
  const pct = (profile.minutes_today / profile.daily_goal_minutes) * 100;
  const hours = Math.floor(profile.minutes_today / 60);
  const mins = profile.minutes_today % 60;
  const done = plan.filter((p) => p.done).length;
  const next = plan.find((p) => !p.done);
  const [titleA, titleB] = missionTitle(profile.goals[0] ?? "Learn &Grow");

  return (
    <div className="space-y-6">
      {/* Featured hero, FUNTYX style */}
      <section className="relative px-1 pb-2 pt-6 sm:pt-10">
        {/* floating decorations */}
        <Cloud className="left-[46%] top-2 hidden opacity-90 sm:block" />
        <Cloud className="bottom-6 left-[38%] hidden scale-75 opacity-80 lg:block" />
        <div
          className="absolute right-[42%] top-24 hidden h-9 w-9 rounded-full bg-coral shadow-lg lg:block"
          aria-hidden
        >
          <span className="absolute -top-1 left-1/2 h-2 w-0.5 -translate-x-1/2 rounded bg-coral-deep" />
        </div>

        <div className="relative flex flex-col gap-2 lg:flex-row lg:items-center">
          {/* left: title block */}
          <div className="max-w-2xl">
            <div className="mb-5 flex items-center gap-3">
              <span className="chip">🔥 {profile.streak}</span>
              <span className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-white/85">
                Day streak
              </span>
            </div>

            <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-white/80">
              {greeting()}, {profile.name}
            </p>
            <h1 className="display mt-3 text-6xl sm:text-7xl lg:text-8xl">
              {titleA}
              <br />
              {titleB}
            </h1>

            {/* meta chips */}
            <div className="mt-6 flex flex-wrap gap-2.5">
              <span className="chip normal-case tracking-normal">
                <BookOpen className="h-3.5 w-3.5" aria-hidden />
                {done}/{plan.length} done today
              </span>
              {next ? (
                <span className="chip normal-case tracking-normal">
                  <Target className="h-3.5 w-3.5" aria-hidden />
                  Next: {next.title}
                </span>
              ) : null}
              <span className="chip normal-case tracking-normal">
                <Clock className="h-3.5 w-3.5" aria-hidden />
                {hours}h {mins}m studied
              </span>
            </div>

            {/* play CTA */}
            <div className="mt-8 flex items-center gap-4">
              <Link
                href="/tutor"
                className="group grid h-16 w-16 place-items-center rounded-full bg-white shadow-[0_14px_30px_-10px_rgba(9,44,84,0.5)] transition-transform hover:scale-105"
                aria-label="Continue learning"
              >
                <Play className="ml-1 h-6 w-6 fill-coral text-coral" />
              </Link>
              <div>
                <Link
                  href="/tutor"
                  className="block text-sm font-black uppercase tracking-[0.18em] text-white hover:text-white/80"
                >
                  Continue learning
                </Link>
                <span className="text-xs font-bold text-white/70">25 min session</span>
              </div>
            </div>
          </div>

          {/* right: giant mascot bleeding off the edge */}
          <div className="relative mt-6 self-end lg:mt-0 lg:-mr-20 lg:self-center">
            <Mascot className="h-64 w-64 sm:h-80 sm:w-80 lg:h-[500px] lg:w-[500px]" />
          </div>
        </div>
      </section>

      {/* Dashboard row inside the frame */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Card>
          <SectionTitle>Today&apos;s progress</SectionTitle>
          <p className="mb-4 text-5xl font-black text-navy">{Math.round(pct)}%</p>
          <ProgressBar
            percent={pct}
            caption={`${hours}h ${mins}m of ${profile.daily_goal_minutes}m goal`}
          />
        </Card>

        <Card className="lg:col-span-2">
          <SectionTitle>Today&apos;s plan</SectionTitle>
          <PlanList items={plan} />
        </Card>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Link
          href="/live"
          className="card-glass flex items-center gap-4 p-6 transition-transform hover:-translate-y-0.5"
        >
          <span className="grid h-12 w-12 place-items-center rounded-full bg-white/90 text-xl">
            🎙️
          </span>
          <div>
            <p className="font-black uppercase tracking-[0.14em] text-white">Talk to Lumi</p>
            <p className="text-xs font-bold text-white/70">Live digital tutor</p>
          </div>
        </Link>
        <Link
          href="/scan"
          className="card-glass flex items-center gap-4 p-6 transition-transform hover:-translate-y-0.5"
        >
          <span className="grid h-12 w-12 place-items-center rounded-full bg-white/90 text-xl">
            📷
          </span>
          <div>
            <p className="font-black uppercase tracking-[0.14em] text-white">Scan &amp; Learn</p>
            <p className="text-xs font-bold text-white/70">Textbook · handwriting · diagrams</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
