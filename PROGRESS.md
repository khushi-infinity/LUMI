# LUMI Build Progress

Last updated: Sep 20, 6:15 PM IST (pre-deadline)

## ✅ DONE (working)

| Area | Detail | Spec |
|---|---|---|
| App scaffold | Next.js + TS + Tailwind v4, FUNTYX-style design system, rounded frame | §37–42 |
| Home | Hero w/ mission title, glass chips, play CTA, dashboard, glass quick actions | §5–6 |
| 3D mascot | R3F floating creature, thinking pulse, hero + tutor + live usage | §40 |
| AI Tutor | 7 explanation modes incl. Socratic, scrollable chat window | §7–8 |
| Live Tutor | Beyond Presence avatar over LiveKit (worker verified ACTIVE), Sarvam voice loop, mic toggle, live chat panel | §9–11 |
| Voice stack | Sarvam Bulbul TTS + Saarika STT proxied server-side, browser fallback | §11, §44 |
| Scan & Learn | Image upload → Bedrock Nova vision / demo → structured result + actions | §12–16 |
| PDF scan | PDF upload → server text extraction → grounded analysis | §17 |
| Practice | Adaptive quiz, ANY typed topic, weakness-first ordering, flashcards + notes tabs | §19–20 |
| Progress | Knowledge graph (color states), calendar streak grid, mastery bars, event feed | §21 |
| Learning engine | Context assembly, learning events, mastery updates, plan reinforcement | §22, §51 |
| Planner API | /api/planner/generate + update (weakness splices revision) | §22 |
| Memory | DynamoDB single-table (seeded) + demo fallback, globalThis singleton | §31–32 |
| AWS | Bedrock live (us-west-2), DynamoDB live, resilience wrapper | §33–35 |
| Auth | Demo guest mode (Cognito is a post-hackathon item) | §28 |
| Security | All keys server-side, .env.local gitignored, proxies for Sarvam | §63 |
| Docs | README (spec §61 shape), architecture.md, PROGRESS.md, .env.example | §61 |
| Deploy | Vercel (user-driven), env vars documented | — |

## ⏳ REMAINING (post-deadline polish)

- Spaced repetition scheduler (SM-2) behind review dates (schema ready: last_reviewed, next_review)
- Learning-aware Pomodoro focus screen (sessions API exists; UI pending)
- Calendar page (events already persist)
- Cognito auth + real multi-user
- RAG via Bedrock Knowledge Bases (S3 document upload → KB sync) — S3 bucket var configured
- Text tutor streaming responses
- Lip-sync audio piping from Sarvam TTS into the LiveKit avatar track
- Delete-my-data / retention UI (privacy spec §64)
