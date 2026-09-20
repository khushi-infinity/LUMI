/* Setup + smoke test for AWS: Bedrock model access, DynamoDB table.
   Run: node scripts/aws-setup.cjs  (reads .env.local via dotenv-less parser below) */
const fs = require("fs");
const {
  BedrockRuntimeClient,
  ConverseCommand,
} = require("@aws-sdk/client-bedrock-runtime");
const {
  DynamoDBClient,
  CreateTableCommand,
  DescribeTableCommand,
  waitUntilTableExists,
} = require("@aws-sdk/client-dynamodb");

// minimal .env.local loader
for (const line of fs.readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const REGION = process.env.AWS_REGION || "us-east-1";
const TABLE = process.env.DYNAMODB_TABLE_NAME || "lumi-student-state";
const MODEL = process.env.BEDROCK_MODEL_ID || "amazon.nova-lite-v1:0";

async function main() {
  console.log(`region: ${REGION}`);

  // 1) credentials valid? (the Converse call below proves IAM + model access)
  const bedrock = new BedrockRuntimeClient({ region: REGION });
  try {
    const res = await bedrock.send(
      new ConverseCommand({
        modelId: MODEL,
        messages: [{ role: "user", content: [{ text: "Reply with exactly: LUMI ONLINE" }] }],
        inferenceConfig: { maxTokens: 16 },
      }),
    );
    const text = res.output?.message?.content?.map((c) => c.text ?? "").join("");
    console.log(`model access OK. Model replied: ${JSON.stringify(text)}`);
  } catch (e) {
    if (e.name === "AccessDeniedException") {
      console.log(`MODEL NOT ENABLED YET: ${e.message}`);
      console.log("→ enable it in the Bedrock console (Model access), then re-run this script.");
    } else {
      console.log("Converse FAILED:", e.name, e.message);
    }
    process.exitCode = 2;
  }

  // 3) DynamoDB table
  const ddb = new DynamoDBClient({ region: REGION });
  try {
    await ddb.send(new DescribeTableCommand({ TableName: TABLE }));
    console.log(`DynamoDB table "${TABLE}" already exists.`);
  } catch (e) {
    if (e.name === "ResourceNotFoundException") {
      console.log(`creating DynamoDB table "${TABLE}"...`);
      await ddb.send(
        new CreateTableCommand({
          TableName: TABLE,
          KeySchema: [
            { AttributeName: "PK", KeyType: "HASH" },
            { AttributeName: "SK", KeyType: "RANGE" },
          ],
          AttributeDefinitions: [
            { AttributeName: "PK", AttributeType: "S" },
            { AttributeName: "SK", AttributeType: "S" },
          ],
          BillingMode: "PAY_PER_REQUEST",
        }),
      );
      await waitUntilTableExists({ client: ddb, maxWaitTime: 30 }, { TableName: TABLE });
      console.log(`table "${TABLE}" is ACTIVE.`);
    } else {
      console.log("DynamoDB check FAILED:", e.name, e.message);
      process.exitCode = 3;
    }
  }
}

main().catch((e) => {
  console.error("unexpected:", e);
  process.exit(1);
});
