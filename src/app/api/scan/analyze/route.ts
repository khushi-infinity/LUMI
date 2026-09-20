import { NextResponse } from "next/server";
import { getAiProvider } from "@/lib/ai";
import { logLearningEvent } from "@/lib/learning-engine";

/** PDF text extraction without native deps. */
async function extractPdfText(buf: Buffer): Promise<string> {
  const mod: unknown = await import("pdf-parse");
  const pdf = ((mod as { default?: unknown }).default ?? mod) as (
    b: Buffer,
  ) => Promise<{ text?: string }>;
  const parsed = await pdf(buf);
  return parsed.text ?? "";
}

/**
 * POST /api/scan/analyze — Scan & Learn (spec §12–17).
 * Images go to Nova multimodal vision; PDFs are text-extracted then analyzed
 * as grounded document text. Demo fallback keeps it functional without AWS.
 */
export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") ?? "";

    // PDF upload path: multipart form with `file`
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file");
      if (!(file instanceof Blob)) {
        return NextResponse.json({ error: "file is required" }, { status: 400 });
      }
      const buf = Buffer.from(await file.arrayBuffer());
      const isPdf =
        file.type === "application/pdf" ||
        buf.subarray(0, 4).toString() === "%PDF";
      if (!isPdf) {
        return NextResponse.json(
          { error: "multipart path accepts PDFs only; send images as JSON base64" },
          { status: 400 },
        );
      }
      const text = await extractPdfText(buf);
      if (!text.trim()) {
        return NextResponse.json(
          { error: "no extractable text (scanned PDFs with images need the vision path)" },
          { status: 422 },
        );
      }
      const result = await getAiProvider().analyzeText({ text });
      await logLearningEvent("SCAN_ANALYZED", `PDF: ${result.topic}`);
      return NextResponse.json(result);
    }

    // Image path (spec §12–16)
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
