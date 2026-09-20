import type { MemoryStore } from "@/lib/memory/store";
import { masteryState } from "@/lib/memory/store";
import type {
  ConceptMastery,
  LearningEvent,
  PlanItem,
  StudentProfile,
} from "@/lib/types";

/**
 * DemoStore: seeded in-memory implementation of the student memory.
 * Shape-compatible with the DynamoDB store: swap by env var, zero product changes.
 */
const PROFILE: StudentProfile = {
  name: "Khushi",
  grade: "2nd year, CS",
  subjects: ["DSA", "DBMS", "Mathematics"],
  goals: ["Crack the DSA midterm in 10 days"],
  streak: 12,
  minutes_today: 135,
  daily_goal_minutes: 180,
};

const INITIAL_PLAN: PlanItem[] = [
  { id: "p1", title: "Arrays", kind: "learn", done: true },
  { id: "p2", title: "Two Pointer", kind: "learn", done: true },
  { id: "p3", title: "Binary Search", kind: "learn", done: false },
  { id: "p4", title: "10 practice questions", kind: "practice", done: false },
];

const INITIAL_MASTERY: ConceptMastery[] = [
  { concept: "dsa", label: "DSA", mastery_score: 0.8, attempts: 40, last_reviewed: iso(-1) },
  { concept: "arrays", label: "Arrays", parent: "dsa", mastery_score: 0.85, attempts: 18, last_reviewed: iso(-1) },
  { concept: "trees", label: "Trees", parent: "dsa", mastery_score: 0.6, attempts: 12, last_reviewed: iso(-2) },
  { concept: "graphs", label: "Graphs", parent: "dsa", mastery_score: 0.2, attempts: 2, last_reviewed: iso(-4) },
  { concept: "bst", label: "BST", parent: "trees", mastery_score: 0.78, attempts: 8, last_reviewed: iso(-2) },
  { concept: "tree_traversal", label: "Traversal", parent: "trees", mastery_score: 0.35, attempts: 5, last_reviewed: iso(-2) },
  { concept: "recursion", label: "Recursion", parent: "trees", mastery_score: 0.3, attempts: 6, last_reviewed: iso(-3) },
  { concept: "binary_search", label: "Binary Search", parent: "dsa", mastery_score: 0.5, attempts: 9, last_reviewed: iso(0) },
  { concept: "binary_search_boundary", label: "Boundary Conditions", parent: "binary_search", mastery_score: 0.25, attempts: 4, last_reviewed: iso(0) },
];

export class DemoStore implements MemoryStore {
  private profile = { ...PROFILE };
  private plan: PlanItem[] = [...INITIAL_PLAN];
  private mastery = new Map(INITIAL_MASTERY.map((m) => [m.concept, { ...m }]));
  private events: LearningEvent[] = [];

  async getProfile(): Promise<StudentProfile> {
    return { ...this.profile };
  }

  async getPlan(): Promise<PlanItem[]> {
    return this.plan.map((p) => ({ ...p }));
  }

  async setPlan(items: PlanItem[]): Promise<void> {
    this.plan = items;
  }

  async getMastery(): Promise<ConceptMastery[]> {
    return [...this.mastery.values()].map((m) => ({ ...m }));
  }

  async updateMastery(concept: string, correct: boolean): Promise<void> {
    const m = this.mastery.get(concept) ?? {
      concept,
      label: concept.replace(/_/g, " "),
      mastery_score: 0.4,
      attempts: 0,
      last_reviewed: iso(0),
    };
    // Simple bounded update; the learning engine tunes the rate per student.
    const delta = correct ? (1 - m.mastery_score) * 0.35 : -m.mastery_score * 0.35;
    m.mastery_score = Math.min(1, Math.max(0.02, m.mastery_score + delta));
    m.attempts += 1;
    m.last_reviewed = iso(0);
    this.mastery.set(concept, m);
    await this.logEvent(correct ? "ANSWER_CORRECT" : "ANSWER_WRONG", concept);
  }

  async addMinutesLearning(minutes: number): Promise<void> {
    this.profile.minutes_today += minutes;
  }

  async logEvent(type: LearningEvent["type"], detail: string): Promise<void> {
    this.events.unshift({ type, detail, at: new Date().toISOString() });
    this.events = this.events.slice(0, 200);
  }

  async getEvents(limit = 20): Promise<LearningEvent[]> {
    return this.events.slice(0, limit);
  }
}

function iso(daysAgo: number): string {
  return new Date(Date.now() + daysAgo * 86_400_000).toISOString().slice(0, 10);
}

/**
 * Process-wide singleton, stashed on globalThis so Next.js dev-mode module
 * re-instantiations (one per route) all share the same student state.
 */
const g = globalThis as unknown as { __lumiDemoStore?: DemoStore };
export const demoStore: DemoStore = (g.__lumiDemoStore ??= new DemoStore());

export { masteryState };
