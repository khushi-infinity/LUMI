# LUMI

> Your AI tutor that sees, hears, teaches and learns with you.

Lumi is a **multimodal AI learning companion**: students ask through text or
voice, speak to a real-time digital-human tutor, scan textbooks and diagrams,
submit handwritten solutions for mistake analysis, take adaptive quizzes, and
get study plans that reshape themselves around detected weaknesses.

Most AI tutors answer questions. **Lumi builds an evolving model of how you
learn** — mastery, mistakes, goals, plans, progress — and adapts what you
should learn next. The combination is the product.

## Demo

Run locally with zero AWS setup (demo mode, seeded student data):

```bash
npm install
npm run dev
```

## Problem

Students juggle YouTube + ChatGPT + Notion + Anki + Calendar + quiz apps.
The student becomes the system connecting all of them — and current AI tutors
don't know what the student already understands, what they got wrong yesterday,
or what's in their textbook.

## Solution — the learning loop

```
LEARN → PRACTICE → MEASURE → FIND WEAKNESS → REINFORCE → PLAN NEXT STEP
```

Every meaningful interaction becomes a **learning event** that updates the
student's mastery model and reshapes their plan.

## Key features (hackathon MVP, spec §56)

| Area | What it does |
| --- | --- |
| **Home** | Personalized command center: greeting, 3D mascot, progress, today's plan, streak |
| **AI Tutor** | Text chat with explanation modes incl. **Socratic mode** — asks instead of answering |
| **Live Tutor** | Real-time digital-human session (Beyond Presence avatar via LiveKit, voice via Sarvam → browser fallback) |
| **Scan & Learn** | Textbook / handwriting / diagram analysis with misconception detection |
| **Practice** | Adaptive quizzes: weak concepts first; every submit updates mastery |
| **Progress** | Knowledge graph (🟢🟡🔴 states), concept mastery, streak, learning event feed |

## How it works

```
Student → Next.js UI → API routes → Learning Engine → AI provider
                                        │
                     memory (DynamoDB) ─┴─ AI (Bedrock + Nova vision)
```

- The **frontend never orchestrates AI directly** — every AI call goes through
  API Gateway-equivalent route handlers (spec, final architecture note).
- Every AI surface has a **structured output schema** (spec §49): explanations,
  quizzes, notes, scans, plans. No arbitrary LLM blobs.

## Architecture

```
src/
├── app/
│   ├── page.tsx              # Home dashboard
│   ├── tutor/                # AI Tutor chat (+ modes, Socratic)
│   ├── live/                 # Live digital-human tutor
│   ├── scan/                 # Scan & Learn
│   ├── practice/             # Adaptive quizzes
│   ├── progress/             # Knowledge graph + mastery
│   └── api/                  # tutor/chat · scan/analyze · quiz/* · notes/
│                             # planner/* · progress · memory · sessions/*
├── components/               # NavBar, mascot (R3F), knowledge graph, ui kit
└── lib/
    ├── ai/                   # AiProvider interface · BedrockProvider · DemoProvider
    ├── memory/               # MemoryStore interface · DynamoDBStore · DemoStore
    ├── voice/                # VoiceProvider · SarvamProvider · BrowserProvider
    ├── learning-engine.ts    # context retrieval + learning events
    ├── planner-service.ts    # dynamic study plans
    ├── quiz-service.ts       # adaptive quiz generation/grading
    └── types.ts              # structured AI output schemas
```

## AWS integration

| Service | Role |
| --- | --- |
| **Bedrock** | Central AI: tutoring, reasoning, quiz/notes generation (Converse API) |
| **Amazon Nova** (Lite/2 Lite) | Multimodal vision: OCR, diagrams, handwriting analysis |
| **S3** | Learning material storage (PDFs, scans, artifacts) |
| **Bedrock Knowledge Bases** | RAG over the student's own textbooks (source of truth) |
| **DynamoDB** | Learning state: profile, mastery, plan, events (single-table) |
| **Lambda + API Gateway** | Production home for the route handlers |
| **EventBridge** | Spaced-repetition scheduling, daily plans, streak processing |
| **Cognito** | Auth (optional; demo mode runs without it) |

Provider selection is automatic: AWS credentials present → Bedrock/DynamoDB.
Otherwise → demo providers with identical behavior.

## Voice architecture (spec §11, §44)

```
VoiceService
├── SarvamVoiceProvider   (Saaras STT · Bulbul TTS · Indian languages, code-mixed)
└── BrowserVoiceProvider  (Web Speech API fallback — always available)
```

Keys stay server-side; voice calls proxy through the backend.

## Beyond Presence integration (spec §10)

Beyond Presence is the **face, not the brain**: your AI agent (Bedrock +
memory + tools) drives conversation; Beyond Presence renders the digital human
over LiveKit. See `src/app/live/page.tsx` for the integration points.

## Tech stack

Next.js (App Router) · TypeScript · Tailwind CSS v4 · Framer Motion-ready ·
React Three Fiber (mascot only — don't turn the app into a WebGL experiment) ·
lucide-react · AWS SDK v3.

## Getting started

```bash
cp .env.example .env.local   # optional — demo mode needs nothing
npm install
npm run dev
```

## Environment variables

See `.env.example` (spec §46). Secrets are never committed and never exposed
to the browser bundle.

## Local development

```bash
npm run dev         # start dev server
npm run typecheck   # strict TS check
npm run build       # production build
```

## Roadmap

Secondary (spec §57): notes UI, flashcards review, Pomodoro, calendar, spaced
repetition scheduler, multilingual voice. Stretch: live whiteboard, real-time
handwriting, collaborative study, teacher mode.

## Limitations

- Demo mode data is in-memory and resets on restart.
- Sarvam/Beyond Presence integrations are stubbed with documented wire-up
  points; they activate via env vars when hackathon credits are available.
- Spaced repetition currently uses a simple bounded mastery update, not the
  full SM-2-style scheduler.

## Credits

Amazon Web Services (Bedrock, Nova, DynamoDB, S3) · Sarvam AI · Beyond
Presence · LiveKit · Next.js · React Three Fiber · Three.js · lucide-react ·
open-source libraries.

## License

MIT (add LICENSE file before publishing).
