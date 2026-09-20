# LUMI Architecture

## The loop

```
understand → teach → test → diagnose → adapt
```

Every feature must answer: **does this help the student learn?** (spec §66)

## Request flow

```
Browser (Next.js)
  │
  ▼
Route handler  (/api/tutor/chat, /api/quiz/*, /api/scan/analyze, …)
  │
  ├─ getMemoryStore()  → DynamoDB (or DemoStore)
  ├─ buildTutorContext() → profile + weak concepts + next plan step
  ├─ getAiProvider()   → Bedrock Converse (or DemoProvider)
  │     └─ vision: Nova multimodal via Converse image blocks
  └─ logLearningEvent() → feeds progress + adaptive planning
```

## Provider boundaries

| Concern | Interface | Demo | Production |
| --- | --- | --- | --- |
| AI reasoning | `AiProvider` | `DemoProvider` | `BedrockProvider` (Bedrock + Nova) |
| Student memory | `MemoryStore` | `DemoStore` (seeded) | `DynamoDBStore` (single-table) |
| Voice | `VoiceProvider` | `BrowserVoiceProvider` | `SarvamVoiceProvider` |

Selection is centralized (`src/lib/{ai,memory,voice}/index.ts`) and env-gated,
so swapping vendors never touches product code.

## Data model (DynamoDB single-table, spec §32)

```
PK = student#<id>
SK = profile                      → StudentProfile
SK = plan                         → PlanItem[]
SK = mastery#<concept>            → attempts, correct, incorrect, last_reviewed
SK = event#<ts>                   → LearningEvent
```

## Structured outputs (spec §49)

The LLM must return JSON matching schemas in `src/lib/types.ts`:
`Explanation`, `Quiz`, `Notes`, `ScanResult`, `StudyPlan`. The Bedrock provider
asks for JSON via the system prompt and falls back to the demo response if the
model output is unparseable — a flaky model can never crash a screen.

## Live tutor separation (spec §10, final note)

```
Student voice → VoiceProvider → AI agent (chat + memory + tools)
                                     │
                              text reply → TTS → audio
                                     │
             Beyond Presence (avatar) over LiveKit → digital human
```

Beyond Presence renders; it does not reason. The chat intelligence is the same
`/api/tutor/chat` pipeline, so live and text tutors share memory and mastery.

## Deployment path (hackathon)

1. `npm run build` → deploy to S3 + CloudFront (static) or Amplify.
2. Route handlers → Lambda behind API Gateway (1:1 mapping of `src/app/api`).
3. DynamoDB table `lumi-student-state` (PK/SK as above).
4. Bedrock model access for `BEDROCK_MODEL_ID` (Nova Lite default).
5. EventBridge rules → spaced repetition + daily plan jobs.

## Security & privacy (spec §63–64)

- All secrets server-side; the browser bundle never sees API keys.
- Signed S3 URLs for uploads; allow deletion; minimize retained conversations.
- Student content is never used for model training.
