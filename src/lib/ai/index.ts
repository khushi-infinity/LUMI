import type { AiProvider } from "@/lib/ai/provider";
import { BedrockProvider } from "@/lib/ai/bedrock-provider";
import { DemoProvider } from "@/lib/ai/mock-provider";

/**
 * One place decides which AI brain LUMI uses.
 * With AWS credentials present → Bedrock (spec §34).
 * Otherwise → DemoProvider so the product is fully explorable with zero keys.
 */
export function getAiProvider(): AiProvider {
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    try {
      return new BedrockProvider();
    } catch {
      // fall through to demo
    }
  }
  return new DemoProvider();
}
