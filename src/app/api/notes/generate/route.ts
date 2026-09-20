import { NextResponse } from "next/server";
import { getAiProvider } from "@/lib/ai";
import { logLearningEvent } from "@/lib/learning-engine";

/** POST /api/notes/generate: AI notes (spec §19) */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { topic: string };
    if (!body.topic?.trim()) {
      return NextResponse.json({ error: "topic is required" }, { status: 400 });
    }
    const notes = await getAiProvider().generateNotes(body.topic);
    await logLearningEvent("NOTE_GENERATED", body.topic);
    return NextResponse.json(notes);
  } catch (err) {
    console.error("notes/generate failed", err);
    return NextResponse.json({ error: "notes generation failed" }, { status: 500 });
  }
}
