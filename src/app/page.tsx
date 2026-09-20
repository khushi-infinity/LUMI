import Link from "next/link";
import { Camera, Mic } from "lucide-react";
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

export default async function HomePage() {
  const [profile, plan] = await Promise.all([
    demoStore.getProfile(),
    demoStore.getPlan(),
  ]);
  const pct = (profile.minutes_today / profile.daily_goal_minutes) * 100;
  const hours = Math.floor(profile.minutes_today / 60);
  const mins = profile.minutes_today % 60;
  const done = plan.filter((p) => p.done).length;

  return (
    <div className="space-y-8">
      {/* Hero (spec §5–6) */}
      <section className="card relative overflow-hidden p-8 sm:p-12">
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          <div className="max-w-xl">
            <p className="text-sm font-extrabold uppercase tracking-widest text-coral-deep">
              {greeting()}, {profile.name} 👋
            </p>
            <h1 className="mt-3 text-4xl font-extrabold leading-tight text-navy sm:text-5xl">
              Ready to learn
              <br />
              something today?
            </h1>
            <p className="mt-3 font-semibold text-navy/60">
              {profile.goals[0]}: you&apos;re on a {profile.streak}-day streak 🔥
            </p>
            <Link href="/tutor" className="btn-primary mt-6 inline-block text-lg">
              Continue Learning →
            </Link>
          </div>
          <Mascot className="mx-auto sm:mx-0 sm:ml-auto" />
        </div>
      </section>

      {/* Today's progress + quick actions */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <SectionTitle>Today&apos;s progress</SectionTitle>
          <p className="mb-4 text-5xl font-extrabold text-navy">
            {Math.round(pct)}%
          </p>
          <ProgressBar
            percent={pct}
            caption={`${hours}h ${mins}m studied · goal ${profile.daily_goal_minutes}m`}
          />
        </Card>

        <Card>
          <SectionTitle>Quick actions</SectionTitle>
          <div className="grid grid-cols-2 gap-4">
            <Link
              href="/live"
              className="card flex flex-col items-center gap-2 bg-lavender p-6 text-center transition-transform hover:-translate-y-0.5"
            >
              <Mic className="h-8 w-8 text-navy" aria-hidden />
              <span className="font-extrabold text-navy">Talk to Lumi</span>
              <span className="text-xs font-semibold text-navy/50">
                Live digital tutor
              </span>
            </Link>
            <Link
              href="/scan"
              className="card flex flex-col items-center gap-2 bg-cream p-6 text-center transition-transform hover:-translate-y-0.5"
            >
              <Camera className="h-8 w-8 text-navy" aria-hidden />
              <span className="font-extrabold text-navy">Scan &amp; Learn</span>
              <span className="text-xs font-semibold text-navy/50">
                Textbook · handwriting · diagrams
              </span>
            </Link>
          </div>
        </Card>
      </div>

      {/* Today's plan */}
      <Card>
        <SectionTitle>Today&apos;s plan</SectionTitle>
        <PlanList items={plan} />
        <p className="mt-4 text-sm font-bold text-navy/50">
          {done}/{plan.length} done: keep the loop going: learn → practice → measure.
        </p>
      </Card>
    </div>
  );
}
