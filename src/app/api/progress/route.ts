import { NextResponse } from "next/server";
import { getMemoryStore } from "@/lib/memory";

/** GET /api/progress — everything the Progress screen needs (spec §6). */
export async function GET() {
  const store = getMemoryStore();
  const [profile, mastery, plan, events] = await Promise.all([
    store.getProfile(),
    store.getMastery(),
    store.getPlan(),
    store.getEvents(15),
  ]);
  return NextResponse.json({ profile, mastery, plan, events });
}
