# Building LUMI: the AI tutor that models how you learn

> **Meta (for the submission form)**
> Title: Building LUMI: a multimodal AI tutor with Amazon Bedrock and DynamoDB
> Description: How we built a tutor that sees your textbook, hears your questions, and adapts to your mistakes, using Bedrock's Converse API, Nova vision, and a single-table DynamoDB learning model.
> Tags: AWS, Amazon Bedrock, Amazon DynamoDB, Amazon Nova, Next.js, AI/ML, Serverless, Hackathon

---

Every AI tutor I've used has the same flaw: amnesia.

It explains recursion brilliantly, then forgets I asked. It doesn't know that I keep failing binary search boundary conditions. It can't see the textbook page I'm stuck on, and it definitely can't look at my handwritten solution and say "you moved the 5 across but forgot to flip its sign."

So for the Bharat Builds Tour: First Commit hackathon, we built **LUMI**: a multimodal AI tutor that maintains an evolving model of how you learn. This post is the technical story: how Amazon Bedrock, Amazon Nova, and a single-table DynamoDB design turned that idea into a working product in one weekend.

## The loop that defines the product

Most "AI tutor" projects are a chat wrapper. We started somewhere else: a learning loop.

```
LEARN → PRACTICE → MEASURE → FIND WEAKNESS → REINFORCE → PLAN NEXT STEP
```

Every interaction in LUMI becomes a **learning event**. A quiz answer updates a per-concept mastery score. A detected weakness splices a reinforcement task into tomorrow's study plan. The Progress screen renders that model as a knowledge graph where every concept is green (strong), amber (developing), or red (needs attention).

The chat is one input into that loop, not the product itself.

## Architecture: three interfaces, swappable everything

One rule shaped the whole codebase: **the frontend never orchestrates AI**. Every AI call goes through server route handlers (a 1:1 map to Lambda + API Gateway when we productionize). On top of that, every capability hides behind an interface:

```ts
export interface AiProvider {
  tutorChat(req: TutorRequest): Promise<{ reply: string; mode: ExplanationMode }>;
  generateQuiz(topic: string, weakConcepts?: string[]): Promise<Quiz>;
  analyzeImage(params: { base64: string; mimeType: string }): Promise<ScanResult>;
  generatePlan(input: PlanInput): Promise<StudyPlan>;
  // ...
}
export interface MemoryStore { /* profile, plan, mastery, events */ }
export interface VoiceProvider { /* STT + TTS */ }
```

`BedrockProvider` and `DemoProvider` both implement `AiProvider`. `DynamoDBStore` and an in-memory store both implement `MemoryStore`. The selection happens in exactly one place per concern, gated by environment variables. That decision paid for itself on day one, and again on day three (more on that later).

## The brain: Amazon Bedrock's Converse API

Bedrock is LUMI's central intelligence, and the Converse API is why integration took an afternoon instead of a weekend. One request shape covers text reasoning, and with an image block it covers vision:

```ts
const res = await bedrock.send(new ConverseCommand({
  modelId: "amazon.nova-lite-v1:0",
  system: [{ text: "You are Lumi, a warm, precise AI tutor..." }],
  messages: [{ role: "user", content: [{ text: prompt }] }],
  inferenceConfig: { maxTokens: 1200, temperature: 0.4 },
}));
```

We run **Amazon Nova Lite** for everything. Text tutoring uses seven explanation modes (simple, detailed, visual, example-first, exam-focused, interview, and Socratic, where the model is instructed to reply with a guiding question instead of an answer). Quizzes, notes, and study plans are generated as **structured JSON against typed schemas**, never free-form blobs:

```ts
// every AI surface has a schema (src/lib/types.ts)
interface QuizQuestion {
  question: string; type: "mcq"; options: string[];
  correct_answer: string; explanation: string;
  concept: string; // the exact sub-concept tested, e.g. "binary_search_boundary"
}
```

That `concept` field is the secret sauce: when you answer wrong, we don't just mark it red, we know *which microscopic concept* failed, and the next quiz weights those questions first.

## Seeing: Nova's multimodal side

Scan & Learn lets a student upload a textbook page, a diagram, or their handwritten solution. The same Converse call carries an image block, and Nova returns JSON with the topic, the concepts on the page, and, for handwritten work, the exact step where the first mistake happens and the misconception behind it. PDFs take a second path: we extract text server-side and ground the analysis in the document itself. The demo fallback returns a pedagogically realistic scan result so the feature is explorable even before AWS keys exist.

## The memory: DynamoDB single-table, done honestly

We didn't want a vector database pretending to be memory. Student memory is structured, so we modeled it structurally: one table, one partition per student.

```
PK = student#<id>
SK = profile                  → StudentProfile
SK = plan                     → today's PlanItem[]
SK = mastery#<concept>        → attempts, correct, incorrect, mastery_score
SK = event#<timestamp>        → LearningEvent feed
```

Grading a quiz atomically bumps mastery counters:

```ts
await doc.send(new UpdateCommand({
  TableName: TABLE,
  Key: { PK: `student#${id}`, SK: `mastery#${concept}` },
  UpdateExpression:
    "ADD attempts :one, correct :c, incorrect :w " +
    "SET last_reviewed = :now, mastery_score = if_not_exists(mastery_score, :ms)",
}));
```

No read-modify-write races, no eventual-consistency surprises when a student answers quickly. The planner reads weak concepts from this table and reshapes the plan; the Progress screen reads it to draw the knowledge graph. One table, one truth.

## Hearing and speaking: Sarvam, proxied for safety

LUMI speaks Indian English (and is built for more Indic languages) through Sarvam's Bulbul TTS and Saarika STT. The API key never touches the browser: the frontend calls `/api/voice/tts` and `/api/voice/stt` on our own server, which forwards to Sarvam. Every voice call has a browser Web Speech fallback, so a Sarvam outage degrades the experience instead of breaking the Live Tutor session.

## The face: Beyond Presence over LiveKit

The Live Tutor renders a real-time digital human. Our backend signs scoped LiveKit room tokens with an HMAC JWT (no extra SDK needed), then asks Beyond Presence to start a speech-to-video worker that joins the student's private room. The browser connects with its own token and displays the avatar video. One subtle bug taught us a lot: a LiveKit room only materializes when the first participant joins, so the avatar worker's token needed the `roomCreate` grant, or the session hung in `to_start` forever.

## What broke (and what we learned)

Being honest, because this is the part that actually taught us things:

- **New AWS accounts propagate.** Right after verification, Bedrock's control plane listed all 115 models while the data plane flickered between working and "Operation not allowed" across regions. We built the resilience wrapper for exactly this: every Bedrock call falls back to the demo brain on failure, so judges never saw a broken screen, and the moment AWS finished propagating, the real model took over with zero code changes. The abstraction earned its keep twice in one weekend.
- **Region matters.** Model availability differs per region; we standardize on `us-west-2` via a single env var.
- **`min-h-0`.** The chat window "losing" its send button was a missing `min-h-0` on a flex child. Classic.
- **Layout is a correctness problem.** Our knowledge graph overlapped until we replaced hardcoded column math with a tidy-tree layout, then *verified zero overlaps by measuring DOM bounding boxes* in a headless browser. If it matters, measure it.

## What's next

SM-2 style spaced repetition on top of the mastery table, a learning-aware Pomodoro that ends with a recall quiz, Cognito auth for real multi-user, and Bedrock Knowledge Bases for RAG over each student's own textbooks.

The sentence we built the whole product around: **most AI tutors answer questions; LUMI builds an evolving model of how you learn.** The AWS stack made that model real: Bedrock for reasoning, Nova for sight, DynamoDB for memory, and one loop tying them together.

**Repo:** [github.com/khushi-infinity/LUMI](https://github.com/khushi-infinity/LUMI)
