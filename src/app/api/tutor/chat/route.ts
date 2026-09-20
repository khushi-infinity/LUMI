import { NextResponse } from "next/server";
import { getAiProvider } from "@/lib/ai";
import { buildTutorContext, logLearningEvent } from "@/lib/learning-engine";
import type { ExplanationMode } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      message: string;
      mode?: ExplanationMode;
      history?: { role: "user" | "assistant"; content: string }[];
    };
    if (!body.message?.trim()) {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }

    const context = await buildTutorContext();
    const provider = getAiProvider();
    const result = await provider.tutorChat({
      message: body.message,
      mode: body.mode ?? "simple",
      history: body.history,
      context: `${context.profileSummary} ${context.masterySummary} ${context.planSummary}`,
    });

    await logLearningEvent("QUESTION_ASKED", body.message.slice(0, 120));
    return NextResponse.json(result);
  } catch (err) {
    console.error("tutor/chat failed", err);
    return NextResponse.json({ error: "tutor failed" }, { status: 500 });
  }
}
