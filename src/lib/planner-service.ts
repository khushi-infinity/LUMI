import { NextResponse } from "next/server";
import { getAiProvider } from "@/lib/ai";
import { getMemoryStore } from "@/lib/memory";
import type { PlanItem } from "@/lib/types";

/**
 * AI Study Planner (spec §22): exam date + daily hours → day-by-day plan.
 * The plan is dynamic: weaknesses detected in quizzes reshape upcoming days.
 */
export async function handlePlannerGenerate(req: Request) {
  try {
    const body = (await req.json()) as {
      goal: string;
      examInDays?: number;
      dailyHours?: number;
    };
    if (!body.goal?.trim()) {
      return NextResponse.json({ error: "goal is required" }, { status: 400 });
    }
    const store = getMemoryStore();
    const mastery = await store.getMastery();
    const weak = mastery.filter((m) => m.mastery_score < 0.45).map((m) => m.concept);

    const plan = await getAiProvider().generatePlan({
      goal: body.goal,
      days: body.examInDays ?? 10,
      dailyHours: body.dailyHours ?? 2,
      weakConcepts: weak,
    });

    // Seed today's plan from day 1 of the generated schedule.
    const today: PlanItem[] = plan.days[0]?.items ?? [];
    const current = await store.getPlan();
    const hasOpen = current.some((p) => !p.done);
    await store.setPlan(hasOpen ? [...current, ...today] : today);

    return NextResponse.json(plan);
  } catch (err) {
    console.error("planner/generate failed", err);
    return NextResponse.json({ error: "planner failed" }, { status: 500 });
  }
}

export async function handlePlannerUpdate(req: Request) {
  try {
    // Reinforce: splice weak-concept revision into tomorrow.
    const body = (await req.json()) as { weaknesses: string[] };
    const store = getMemoryStore();
    const plan = await store.getPlan();
    const target = plan.find((p) => !p.done);
    if (target && body.weaknesses?.length) {
      plan.splice(plan.indexOf(target) + 1, 0, {
        id: `reinforce-${Date.now()}`,
        title: `Reinforce: ${body.weaknesses.join(", ")}`,
        kind: "revise",
        done: false,
        reason: "Weakness detected in your last quiz",
      });
      await store.setPlan(plan);
    }
    return NextResponse.json({ plan });
  } catch (err) {
    console.error("planner/update failed", err);
    return NextResponse.json({ error: "planner update failed" }, { status: 500 });
  }
}
