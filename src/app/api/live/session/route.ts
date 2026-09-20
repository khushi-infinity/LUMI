import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { signLivekitToken } from "@/lib/livekit";

/**
 * POST /api/live/session — creates the Beyond Presence avatar session.
 *
 * Flow (spec §10): our AI agent stays the brain; Bey renders the face.
 * 1. Sign two LiveKit tokens: one for the Bey avatar worker (publisher),
 *    one for this student's browser (join + publish mic/audio).
 * 2. Ask api.bey.dev to start the avatar worker and join our LiveKit room.
 * 3. Return the LiveKit URL + client token so the browser can connect and
 *    render the digital human.
 *
 * All secrets stay server-side. Requires BEY_* and LIVEKIT_* env vars;
 * returns a descriptive 501 with what's missing so the UI can fall back.
 */
export async function POST() {
  const missing = [
    !process.env.BEY_API_KEY && "BEY_API_KEY",
    !process.env.BEY_AVATAR_ID && "BEY_AVATAR_ID",
    !process.env.LIVEKIT_URL && "LIVEKIT_URL",
    !process.env.LIVEKIT_API_KEY && "LIVEKIT_API_KEY",
    !process.env.LIVEKIT_API_SECRET && "LIVEKIT_API_SECRET",
  ].filter(Boolean) as string[];

  if (missing.length) {
    return NextResponse.json(
      { error: "avatar session unavailable", missing },
      { status: 501 },
    );
  }

  const room = `lumi-live-${randomUUID().slice(0, 8)}`;
  try {
    const avatarToken = signLivekitToken({
      apiKey: process.env.LIVEKIT_API_KEY!,
      apiSecret: process.env.LIVEKIT_API_SECRET!,
      identity: "bey-avatar-worker",
      name: "Lumi Avatar",
      ttlSeconds: 60 * 30,
      grant: {
        room,
        roomJoin: true,
        canPublish: true,
        canSubscribe: true,
        canPublishData: true,
      },
    });

    const res = await fetch("https://api.bey.dev/v1/sessions", {
      method: "POST",
      headers: {
        "x-api-key": process.env.BEY_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        avatar_id: process.env.BEY_AVATAR_ID,
        url: process.env.LIVEKIT_URL,
        token: avatarToken,
        transport: "livekit",
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error("bey session failed", res.status, detail.slice(0, 300));
      return NextResponse.json({ error: "avatar session failed" }, { status: 502 });
    }

    const session = (await res.json()) as { id: string };
    const clientToken = signLivekitToken({
      apiKey: process.env.LIVEKIT_API_KEY!,
      apiSecret: process.env.LIVEKIT_API_SECRET!,
      identity: `student-${randomUUID().slice(0, 8)}`,
      name: "Student",
      ttlSeconds: 60 * 60,
      grant: {
        room,
        roomJoin: true,
        canPublish: true,
        canSubscribe: true,
        canPublishData: true,
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      livekitUrl: process.env.LIVEKIT_URL,
      clientToken,
      room,
    });
  } catch (err) {
    console.error("live/session failed", err);
    return NextResponse.json({ error: "avatar session failed" }, { status: 500 });
  }
}
