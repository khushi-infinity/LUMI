/* Seed lumi-student-state with the demo student so the real backend starts
   with the same experience as the in-memory demo. Run: node scripts/seed-dynamodb.cjs */
const fs = require("fs");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");

for (const line of fs.readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const doc = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: process.env.AWS_REGION || "us-east-1" }),
);
const TABLE = process.env.DYNAMODB_TABLE_NAME || "lumi-student-state";
const PK = "student#demo-student";

function iso(daysAgo) {
  return new Date(Date.now() + daysAgo * 86400000).toISOString().slice(0, 10);
}

const profile = {
  name: "Khushi",
  grade: "2nd year, CS",
  subjects: ["DSA", "DBMS", "Mathematics"],
  goals: ["Crack the DSA midterm in 10 days"],
  streak: 12,
  minutes_today: 135,
  daily_goal_minutes: 180,
};

const plan = [
  { id: "p1", title: "Arrays", kind: "learn", done: true },
  { id: "p2", title: "Two Pointer", kind: "learn", done: true },
  { id: "p3", title: "Binary Search", kind: "learn", done: false },
  { id: "p4", title: "10 practice questions", kind: "practice", done: false },
];

const mastery = [
  ["dsa", "DSA", null, 0.8],
  ["arrays", "Arrays", "dsa", 0.85],
  ["trees", "Trees", "dsa", 0.6],
  ["graphs", "Graphs", "dsa", 0.2],
  ["bst", "BST", "trees", 0.78],
  ["tree_traversal", "Traversal", "trees", 0.35],
  ["recursion", "Recursion", "trees", 0.3],
  ["binary_search", "Binary Search", "dsa", 0.5],
  ["binary_search_boundary", "Boundary Conditions", "binary_search", 0.25],
  ["binary_search_midpoint", "Midpoint", "binary_search", 0.5],
  ["binary_search_precondition", "Precondition", "binary_search", 0.55],
  ["binary_search_search_space", "Search Space", "binary_search", 0.45],
];

async function put(Item) {
  await doc.send(new PutCommand({ TableName: TABLE, Item }));
}

async function main() {
  await put({ PK, SK: "profile", profile });
  await put({ PK, SK: "plan", items: plan });
  for (const [concept, label, parent, score] of mastery) {
    const attempts = Math.max(2, Math.round(score * 20));
    const correct = Math.round(attempts * score);
    await put({
      PK,
      SK: `mastery#${concept}`,
      concept,
      label,
      parent: parent ?? undefined,
      mastery_score: score,
      attempts,
      correct,
      incorrect: attempts - correct,
      last_reviewed: iso(-1),
    });
  }
  console.log(`seeded ${2 + mastery.length} items into ${TABLE}`);
}

main().catch((e) => {
  console.error("seed failed:", e.name, e.message);
  process.exit(1);
});
