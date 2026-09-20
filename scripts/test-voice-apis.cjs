/* Quick key validation for Sarvam TTS + Beyond Presence. Run: node scripts/test-voice-apis.cjs */
const fs = require("fs");
for (const line of fs.readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

async function sarvamTTS() {
  const res = await fetch("https://api.sarvam.ai/text-to-speech", {
    method: "POST",
    headers: {
      "api-subscription-key": process.env.SARVAM_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: "Hello! I am Lumi, your study buddy.",
      language_code: "en-IN",
      speaker: "shubh",
      model: "bulbul:v3",
      output_audio_codec: "mp3",
    }),
  });
  const body = await res.text();
  console.log("Sarvam TTS status:", res.status);
  try {
    const j = JSON.parse(body);
    const keys = Object.keys(j);
    console.log("  response keys:", keys);
    if (j.audios) console.log("  audio items:", j.audios.length, "| first 40 b64 chars:", String(j.audios[0]).slice(0, 40));
  } catch {
    console.log("  raw:", body.slice(0, 200));
  }
}

async function beyAvatars() {
  const res = await fetch("https://api.bey.dev/v1/avatars", {
    headers: { "x-api-key": process.env.BEY_API_KEY },
  });
  const body = await res.text();
  console.log("Bey avatars status:", res.status);
  try {
    const j = JSON.parse(body);
    const list = Array.isArray(j) ? j : j.avatars ?? [];
    console.log("  avatars:", list.length);
    for (const a of list.slice(0, 5)) console.log("  -", a.id, "|", a.name ?? a.display_name ?? "");
    if (list.length) console.log("PICK_THIS_AVATAR_ID=" + list[0].id);
  } catch {
    console.log("  raw:", body.slice(0, 300));
  }
}

(async () => {
  await sarvamTTS();
  await beyAvatars();
})();
