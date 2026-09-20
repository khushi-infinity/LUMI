import { getAiProvider } from "@/lib/ai";
import { getMemoryStore } from "@/lib/memory";
import type { MemoryStore } from "@/lib/memory/store";
import type { ExplanationMode } from "@/lib/types";

/**
 * The Learning Engine (spec §51):
 *   input → intent → context retrieval → knowledge retrieval → reasoning
 *         → response → learning event → mastery update → recommendation
 * Every meaningful interaction becomes a learning event.
 */
export interface TutorContext {
  profileSummary: string;
  masterySummary: string;
  planSummary: string;
}

export async function buildTutorContext(): Promise<TutorContext> {
  const store = getMemoryStore();
  const [profile, mastery, plan] = await Promise.all([
    store.getProfile(),
    store.getMastery(),
    store.getPlan(),
  ]);

  const weak = mastery
    .filter((m) => m.mastery_score < 0.45)
    .map((m) => `${m.label} (${Math.round(m.mastery_score * 100)}%)`);

  const nextStep = plan.find((p) => !p.done)?.title ?? "free study";

  return {
    profileSummary: `${profile.name}, ${profile.grade}. Subjects: ${profile.subjects.join(", ")}. Goal: ${profile.goals[0] ?? "learning"}.`,
    masterySummary: weak.length
      ? `Weak concepts right now: ${weak.join("; ")}.`
      : "No critical weaknesses detected recently.",
    planSummary: `Next up in today's plan: ${nextStep}.`,
  };
}

export async function logLearningEvent(
  type: Parameters<MemoryStore["logEvent"]>[0],
  detail: string,
): Promise<void> {
  await getMemoryStore().logEvent(type, detail);
}

export function providerName(): string {
  return getAiProvider().name;
}

export type { ExplanationMode };
