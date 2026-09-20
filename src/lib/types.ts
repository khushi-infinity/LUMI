/**
 * Structured AI outputs (spec §49).
 * The LLM never returns arbitrary blobs — every AI surface has a schema.
 */

export type ExplanationMode =
  | "simple"
  | "detailed"
  | "visual"
  | "example-first"
  | "exam-focused"
  | "interview-focused"
  | "socratic";

export interface Explanation {
  topic: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  explanation: string;
  key_points: string[];
  misconceptions: string[];
  next_action: "quiz" | "explain" | "practice" | "notes";
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: "mcq";
  options: string[];
  correct_answer: string;
  explanation: string;
  concept: string; // e.g. "binary_search_boundary"
}

export interface Quiz {
  topic: string;
  questions: QuizQuestion[];
}

export interface QuizResult {
  score: number;
  total: number;
  weaknesses: string[]; // concepts that failed
  strengths: string[];
  recommendation: string;
}

export interface Notes {
  topic: string;
  quick_notes: string[];
  exam_sheet: string[];
  flashcards: { question: string; answer: string }[];
  common_mistakes: string[];
  sixty_second_explanation: string;
}

export interface ScanResult {
  topic: string;
  kind: "textbook" | "handwriting" | "diagram" | "object" | "code" | "unknown";
  concepts: string[];
  summary: string;
  mistakes?: { step: string; issue: string; fix: string }[];
  actions: ("explain" | "quiz" | "notes" | "flashcards" | "add_to_plan")[];
}

export interface PlanItem {
  id: string;
  title: string;
  kind: "learn" | "practice" | "revise" | "mock";
  done: boolean;
  reason?: string;
}

export interface StudyPlan {
  goal: string;
  days: { day: number; date: string; items: PlanItem[] }[];
}

export interface ConceptMastery {
  concept: string;
  label: string;
  parent?: string;
  mastery_score: number; // 0..1
  attempts: number;
  last_reviewed: string;
}

export interface StudentProfile {
  name: string;
  grade: string;
  subjects: string[];
  goals: string[];
  streak: number;
  minutes_today: number;
  daily_goal_minutes: number;
}

export interface LearningEvent {
  type:
    | "CONCEPT_VIEWED"
    | "QUESTION_ASKED"
    | "QUIZ_STARTED"
    | "QUIZ_COMPLETED"
    | "ANSWER_CORRECT"
    | "ANSWER_WRONG"
    | "MISTAKE_DETECTED"
    | "NOTE_GENERATED"
    | "SCAN_ANALYZED"
    | "FOCUS_SESSION_COMPLETED"
    | "LIVE_TUTOR_SESSION";
  detail: string;
  at: string;
}
