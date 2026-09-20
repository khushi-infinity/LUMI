import type {
  ConceptMastery,
  LearningEvent,
  PlanItem,
  StudentProfile,
} from "@/lib/types";

/**
 * Student memory (spec §31–32): structured, not a vector dump.
 * Short-term conversation lives in the chat session; this is the
 * long-term learning memory that feeds every AI request.
 * All methods are async so DynamoDB and in-memory stores are interchangeable.
 */
export interface MemoryStore {
  getProfile(): Promise<StudentProfile>;
  getPlan(): Promise<PlanItem[]>;
  setPlan(items: PlanItem[]): Promise<void>;
  getMastery(): Promise<ConceptMastery[]>;
  updateMastery(concept: string, correct: boolean): Promise<void>;
  addMinutesLearning(minutes: number): Promise<void>;
  logEvent(type: LearningEvent["type"], detail: string): Promise<void>;
  getEvents(limit?: number): Promise<LearningEvent[]>;
}

export const MASTERY_STATES = {
  strong: { min: 0.75, dot: "🟢", label: "Strong" },
  developing: { min: 0.45, dot: "🟡", label: "Developing" },
  weak: { min: 0, dot: "🔴", label: "Needs attention" },
} as const;

export function masteryState(score: number): keyof typeof MASTERY_STATES {
  if (score >= MASTERY_STATES.strong.min) return "strong";
  if (score >= MASTERY_STATES.developing.min) return "developing";
  return "weak";
}
