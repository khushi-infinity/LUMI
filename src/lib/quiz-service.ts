import { NextResponse } from "next/server";
import { getAiProvider } from "@/lib/ai";
import { getMemoryStore } from "@/lib/memory";
import { logLearningEvent } from "@/lib/learning-engine";
import type { Quiz, QuizResult } from "@/lib/types";

/**
 * Adaptive quizzes (spec §20):
 *   generate → answer → evaluate → identify misconception
 *   → update knowledge state → generate next question
 */
export async function handleQuizGenerate(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as { topic?: string };
    const store = getMemoryStore();
    const mastery = await store.getMastery();
    const weak = mastery.filter((m) => m.mastery_score < 0.45).map((m) => m.concept);

    const quiz = await getAiProvider().generateQuiz(body.topic ?? "Binary Search", weak);
    await logLearningEvent("QUIZ_STARTED", quiz.topic);
    return NextResponse.json(quiz);
  } catch (err) {
    console.error("quiz/generate failed", err);
    return NextResponse.json({ error: "quiz generation failed" }, { status: 500 });
  }
}

export async function handleQuizSubmit(req: Request) {
  try {
    const body = (await req.json()) as {
      quiz: Quiz;
      answers: Record<string, string>; // questionId → chosen option
      durationMinutes?: number;
    };
    if (!body.quiz?.questions || !body.answers) {
      return NextResponse.json({ error: "quiz and answers required" }, { status: 400 });
    }

    const store = getMemoryStore();
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    let score = 0;

    for (const q of body.quiz.questions) {
      const correct = body.answers[q.id] === q.correct_answer;
      if (correct) score++;
      await store.updateMastery(q.concept, correct);
      (correct ? strengths : weaknesses).push(q.concept);
    }
    if (body.durationMinutes) await store.addMinutesLearning(body.durationMinutes);
    await logLearningEvent("QUIZ_COMPLETED", `${body.quiz.topic}: ${score}/${body.quiz.questions.length}`);

    const total = body.quiz.questions.length;
    const result: QuizResult = {
      score,
      total,
      strengths: [...new Set(strengths)],
      weaknesses: [...new Set(weaknesses)],
      recommendation:
        weaknesses.length > 0
          ? `Weakness detected: ${[...new Set(weaknesses)].join(", ")}. Reinforcement added to your plan.`
          : "Strong across the board. Ready for the next topic!",
    };
    return NextResponse.json(result);
  } catch (err) {
    console.error("quiz/submit failed", err);
    return NextResponse.json({ error: "quiz submission failed" }, { status: 500 });
  }
}
