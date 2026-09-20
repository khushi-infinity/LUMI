"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Camera, Loader2, Upload } from "lucide-react";
import Mascot from "@/components/mascot/Mascot";
import { Card, SectionTitle } from "@/components/ui";
import type { ScanResult } from "@/lib/types";

const KINDS = ["Textbook page", "Handwritten answer", "Diagram", "Object", "Lecture slide"] as const;

export default function ScanPage() {
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setBusy(true);
    setError(null);
    setResult(null);
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = String(reader.result);
      setPreview(dataUrl);
      const base64 = dataUrl.split(",")[1] ?? "";
      try {
        const res = await fetch("/api/scan/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64: base64,
            mimeType: file.type || "image/jpeg",
            currentTopic: "Binary Search",
          }),
        });
        const data = (await res.json()) as ScanResult & { error?: string };
        if (data.error) setError(data.error);
        else setResult(data);
      } catch {
        setError("Analysis failed: try again.");
      } finally {
        setBusy(false);
      }
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-navy">Scan &amp; Learn</h1>
          <p className="font-semibold text-navy/60">
            Point, snap, understand: textbooks, handwriting, diagrams, objects.
          </p>
        </div>
        <Mascot thinking={busy} className="h-28 w-28" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Upload */}
        <Card>
          <SectionTitle>What are you looking at?</SectionTitle>
          <div className="mb-4 flex flex-wrap gap-2 text-xs font-bold text-navy/60">
            {KINDS.map((k) => (
              <span key={k} className="rounded-full bg-lavender px-3 py-1">
                {k}
              </span>
            ))}
          </div>

          <label
            className="flex cursor-pointer flex-col items-center gap-3 rounded-3xl border-4 border-dashed border-navy/15 bg-white/60 p-10 text-center transition-colors hover:border-coral"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0];
              if (f) handleFile(f);
            }}
          >
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt="Your scan"
                className="max-h-48 rounded-2xl object-contain"
              />
            ) : (
              <>
                <Camera className="h-12 w-12 text-navy/50" aria-hidden />
                <span className="font-extrabold text-navy/70">
                  Drop a photo, or click to browse
                </span>
              </>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
            {busy ? (
              <span className="flex items-center gap-2 font-bold text-coral-deep">
                <Loader2 className="h-4 w-4 animate-spin" /> Lumi is reading it…
              </span>
            ) : null}
          </label>
          {error ? (
            <p className="mt-3 font-bold text-rose-low">{error}</p>
          ) : null}
        </Card>

        {/* Result */}
        <Card className={result ? "" : "opacity-70"}>
          <SectionTitle>Lumi sees</SectionTitle>
          {result ? (
            <div className="space-y-4">
              <div className="flex items-baseline gap-3">
                <h3 className="text-2xl font-extrabold text-navy">{result.topic}</h3>
                <span className="rounded-full bg-lavender px-3 py-1 text-xs font-extrabold uppercase text-navy/60">
                  {result.kind}
                </span>
              </div>
              <p className="font-semibold text-navy/70">{result.summary}</p>

              <div>
                <p className="mb-2 text-xs font-extrabold uppercase tracking-wide text-navy/50">
                  Concepts on this page
                </p>
                <ul className="space-y-1.5">
                  {result.concepts.map((c) => (
                    <li key={c} className="flex items-center gap-2 font-bold text-navy">
                      <span className="h-2 w-2 rounded-full bg-coral" /> {c}
                    </li>
                  ))}
                </ul>
              </div>

              {result.mistakes?.length ? (
                <div className="rounded-2xl bg-rose-low/10 p-4">
                  <p className="mb-2 text-xs font-extrabold uppercase tracking-wide text-rose-low">
                    Mistake found
                  </p>
                  {result.mistakes.map((m, i) => (
                    <p key={i} className="font-semibold text-navy">
                      <strong>Step:</strong> {m.step}: {m.issue}
                      <br />
                      <strong className="text-lime-ok">Fix:</strong> {m.fix}
                    </p>
                  ))}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2 pt-2">
                <Link href={`/tutor`} className="btn-primary text-sm">
                  Explain this
                </Link>
                <Link href="/practice" className="btn-secondary text-sm">
                  Quiz me
                </Link>
                <Link href="/progress" className="btn-secondary text-sm">
                  Add to study plan
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid h-64 place-items-center text-center">
              <p className="font-bold text-navy/40">
                <Upload className="mx-auto mb-2 h-8 w-8" aria-hidden />
                Your scan&apos;s topics, concepts and next actions appear here.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
