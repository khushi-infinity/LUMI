/* List Bedrock foundation models visible to this account. Run: node scripts/list-bedrock-models.cjs */
const fs = require("fs");
const {
  BedrockClient,
  ListFoundationModelsCommand,
} = require("@aws-sdk/client-bedrock");

for (const line of fs.readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

async function main() {
  const client = new BedrockClient({ region: process.env.AWS_REGION || "us-east-1" });
  const res = await client.send(new ListFoundationModelsCommand({}));
  const nova = (res.modelSummaries || []).filter((m) =>
    /nova/i.test(m.modelId || ""),
  );
  console.log(`total models: ${(res.modelSummaries || []).length}, Nova: ${nova.length}`);
  for (const m of nova) {
    console.log(
      `${m.modelId} | ${m.lifecycleStatus} | in/out: ${(m.inputModalities || []).join("+")}->${(m.outputModalities || []).join("+")}`,
    );
  }
}

main().catch((e) => {
  console.error("failed:", e.name, e.message);
  process.exit(1);
});
