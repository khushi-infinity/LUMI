import type { AiProvider } from "@/lib/ai/provider";
import { hasAwsCredentials } from "@/lib/aws-creds";
import { BedrockProvider } from "@/lib/ai/bedrock-provider";
import { DemoProvider } from "@/lib/ai/mock-provider";

/**
 * ResilientProvider (spec §44 policy: the app never breaks because an
 * external API is unavailable). Tries Bedrock first; on any failure it
 * transparently serves the demo brain so every screen keeps working.
 * This also bridges the new-AWS-account verification window.
 */
class ResilientProvider implements AiProvider {
  readonly name = "bedrock+fallback";
  private fallback = new DemoProvider();
  private primary: AiProvider | null = null;

  constructor() {
    if (hasAwsCredentials()) {
      try {
        this.primary = new BedrockProvider();
      } catch (e) {
        console.error("BedrockProvider init failed, using demo:", e);
      }
    }
  }

  async withFallback<T>(fn: (p: AiProvider) => Promise<T>): Promise<T> {
    if (this.primary) {
      try {
        return await fn(this.primary);
      } catch (e) {
        console.error("Bedrock call failed, falling back to demo brain:", e);
      }
    }
    return fn(this.fallback);
  }

  tutorChat(req: Parameters<AiProvider["tutorChat"]>[0]) {
    return this.withFallback((p) => p.tutorChat(req));
  }
  explain(topic: string, mode: Parameters<AiProvider["explain"]>[1]) {
    return this.withFallback((p) => p.explain(topic, mode));
  }
  generateQuiz(topic: string, weakConcepts?: string[]) {
    return this.withFallback((p) => p.generateQuiz(topic, weakConcepts));
  }
  generateNotes(topic: string) {
    return this.withFallback((p) => p.generateNotes(topic));
  }
  analyzeImage(params: Parameters<AiProvider["analyzeImage"]>[0]) {
    return this.withFallback((p) => p.analyzeImage(params));
  }
  analyzeText(params: Parameters<AiProvider["analyzeText"]>[0]) {
    return this.withFallback((p) => p.analyzeText(params));
  }
  generatePlan(input: Parameters<AiProvider["generatePlan"]>[0]) {
    return this.withFallback((p) => p.generatePlan(input));
  }
}

let cached: AiProvider | null = null;

/** One place decides which AI brain LUMI uses (env-gated, never crashes). */
export function getAiProvider(): AiProvider {
  if (!cached) cached = new ResilientProvider();
  return cached;
}
