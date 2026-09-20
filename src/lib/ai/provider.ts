import type {
  Explanation,
  ExplanationMode,
  Notes,
  Quiz,
  ScanResult,
  StudyPlan,
} from "@/lib/types";

/**
 * The AI layer is provider-agnostic (spec §11/§44):
 * everything above this interface only knows `AiProvider`.
 */
export interface TutorRequest {
  message: string;
  mode: ExplanationMode;
  context?: string; // memory/retrieval summary injected by the caller
  history?: { role: "user" | "assistant"; content: string }[];
}

export interface AiProvider {
  readonly name: string;
  tutorChat(req: TutorRequest): Promise<{ reply: string; mode: ExplanationMode }>;
  explain(topic: string, mode: ExplanationMode): Promise<Explanation>;
  generateQuiz(topic: string, weakConcepts?: string[]): Promise<Quiz>;
  generateNotes(topic: string): Promise<Notes>;
  analyzeImage(params: {
    base64: string;
    mimeType: string;
    currentTopic?: string;
  }): Promise<ScanResult>;
  generatePlan(input: {
    goal: string;
    days: number;
    dailyHours: number;
    weakConcepts: string[];
  }): Promise<StudyPlan>;
}
