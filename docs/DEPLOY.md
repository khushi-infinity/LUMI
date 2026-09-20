# Deploy LUMI on AWS (Amplify Hosting)

The hackathon's Ship It track requires a **live AWS URL**, and "the architecture is part of the score". Amplify Hosting is the right tool: it hosts the Next.js app (SSR + API routes), connects straight to this GitHub repo, gives an `*.amplifyapp.com` URL, and redeploys on every push.

## Steps (≈4 minutes)

1. Open **https://console.aws.amazon.com/amplify/** (region: any, pick `us-west-2` to sit next to Bedrock/DynamoDB).
2. Click **Create new app** → **Host web app**.
3. **GitHub** → **Connect** → authorize AWS Amplify (one-time OAuth) → pick `khushi-infinity/LUMI`, branch `main`.
4. App settings: it auto-detects **Next.js**; leave build settings as-is.
5. **Advanced settings → Environment variables** — add all of:

```
AWS_REGION=us-west-2
AWS_ACCESS_KEY_ID=<your key>
AWS_SECRET_ACCESS_KEY=<your secret>
BEDROCK_MODEL_ID=amazon.nova-lite-v1:0
DYNAMODB_TABLE_NAME=lumi-student-state
S3_BUCKET_NAME=lumi-learning-material
SARVAM_API_KEY=<your key>
BEY_API_KEY=<your key>
BEY_AVATAR_ID=b9be11b8-89fb-4227-8f86-4a881393cbdb
LIVEKIT_URL=wss://lumi-ouabndw2.livekit.cloud
LIVEKIT_API_KEY=<your key>
LIVEKIT_API_SECRET=<your secret>
```

6. **Save and deploy** → wait for the green check → copy the URL (`https://main.xxxxx.amplifyapp.com`).

## After deploy (2 min)

- Open the URL, click through all 6 tabs once.
- **Live Tutor → Start session**: the Beyond Presence avatar video should appear (worker joins your LiveKit room from AWS's IP, which is fine — LiveKit has no IP allowlist by default).
- If anything AI-ish falls back to demo mode, it still works; that's the resilience layer doing its job.

## Why Amplify and not Vercel

The rubric says deploy on AWS and score the architecture. Amplify keeps compute, data, and AI in one cloud story: Amplify (edge + SSR) → Bedrock → DynamoDB, all under one IAM umbrella.
