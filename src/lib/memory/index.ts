import type { MemoryStore } from "@/lib/memory/store";
import { DemoStore } from "@/lib/memory/demo-store";
import { DynamoDBStore } from "@/lib/memory/dynamo-store";

let cached: MemoryStore | null = null;

/** Memory backend selection: DynamoDB when configured, demo otherwise. */
export function getMemoryStore(): MemoryStore {
  if (!cached) {
    cached =
      process.env.AWS_ACCESS_KEY_ID && process.env.DYNAMODB_TABLE_NAME
        ? new DynamoDBStore()
        : new DemoStore();
  }
  return cached;
}
