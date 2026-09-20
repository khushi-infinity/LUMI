import { NextResponse } from "next/server";
import { getMemoryStore } from "@/lib/memory";
import { logLearningEvent } from "@/lib/learning-engine";

/**
 * Focus sessions (spec §23): a Pomodoro that knows what you studied.
 * POST /api/sessions/start   { topic, goal }
 * POST /api/sessions/end     { topic, minutes }
 */
export async function POST(req: Request) {
  try {
    const end = new URL(req.url).pathname.endsWith("/end");
    const body = (await req.json()) as {
      topic?: string;
      goal?: string;
      minutes?: number;
    };
    const store = getMemoryStore();

    if (end) {
      const minutes = Math.max(0, body.minutes ?? 0);
      await store.addMinutesLearning(minutes);
      await logLearningEvent(
        "FOCUS_SESSION_COMPLETED",
        `${body.topic ?? "General"}: ${minutes} min`,
      );
      return NextResponse.json({
        ok: true,
        recallPrompt:
          minutes >= 20
            ? `You finished a ${minutes}-minute focus session on ${body.topic ?? "your topic"}. Want to test what you remember?`
            : null,
      });
    }

    await logLearningEvent(
      "CONCEPT_VIEWED",
      `Focus session started: ${body.topic ?? "General"}: ${body.goal ?? ""}`,
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("sessions failed", err);
    return NextResponse.json({ error: "session failed" }, { status: 500 });
  }
}
