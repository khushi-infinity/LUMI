import { NextResponse } from "next/server";
import { getAiProvider } from "@/lib/ai";
import { logLearningEvent } from "@/lib/learning-engine";

/** Scan & Learn (spec §12–16): textbook, handwriting, diagrams, objects. */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      imageBase64: string;
      mimeType: string;
      currentTopic?: string;
    };
    if (!body.imageBase64) {
      return NextResponse.json({ error: "imageBase64 is required" }, { status: 400 });
    }

    const result = await getAiProvider().analyzeImage({
      base64: body.imageBase64,
      mimeType: body.mimeType || "image/jpeg",
      currentTopic: body.currentTopic,
    });

    await logLearningEvent("SCAN_ANALYZED", result.topic);
    return NextResponse.json(result);
  } catch (err) {
    console.error("scan/analyze failed", err);
    return NextResponse.json({ error: "scan analysis failed" }, { status: 500 });
  }
}
