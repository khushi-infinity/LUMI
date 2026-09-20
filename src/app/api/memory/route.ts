import { NextResponse } from "next/server";
import { buildTutorContext } from "@/lib/learning-engine";
import { getMemoryStore } from "@/lib/memory";

/** GET /api/memory/context — what LUMI knows about this student right now. */
export async function GET() {
  const context = await buildTutorContext();
  return NextResponse.json(context);
}

/** POST /api/memory/update — log a learning event or focus minutes. */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      eventType?: string;
      detail?: string;
      focusMinutes?: number;
    };
    const store = getMemoryStore();
    if (body.focusMinutes) {
      await store.addMinutesLearning(body.focusMinutes);
    }
    if (body.eventType) {
      await store.logEvent(body.eventType as never, body.detail ?? "");
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("memory/update failed", err);
    return NextResponse.json({ error: "memory update failed" }, { status: 500 });
  }
}
