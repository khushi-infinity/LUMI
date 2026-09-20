import {
  BedrockRuntimeClient,
  ConverseCommand,
  type Message,
} from "@aws-sdk/client-bedrock-runtime";
import type { AiProvider, TutorRequest } from "@/lib/ai/provider";
import { DemoProvider } from "@/lib/ai/mock-provider";
import type {
  Explanation,
  ExplanationMode,
  Notes,
  Quiz,
  ScanResult,
  StudyPlan,
} from "@/lib/types";

/**
 * BedrockProvider: the real AI layer (spec §34).
 * Bedrock is the central intelligence: tutoring, reasoning, quizzes, notes,
 * and Nova multimodal understanding for Scan & Learn.
 *
 * Falls back to DemoProvider behaviour per-call if the model's JSON is
 * unparseable, so a flaky model response can never crash a screen.
 */
export class BedrockProvider implements AiProvider {
  readonly name = "bedrock";
  private client: BedrockRuntimeClient;
  private modelId: string;
  private demo = new DemoProvider();

  constructor(region?: string) {
    this.client = new BedrockRuntimeClient({ region: region ?? process.env.AWS_REGION });
    this.modelId = process.env.BEDROCK_MODEL_ID || "amazon.nova-lite-v1:0";
  }

  private async converse(
    system: string,
    userContent: string,
    image?: { base64: string; mimeType: string },
  ): Promise<string> {
    const content: Array<Record<string, unknown>> = [];
    if (image) {
      content.push({
        image: {
          format: image.mimeType.replace("image/", "").replace("jpeg", "jpg"),
          source: { bytes: Buffer.from(image.base64, "base64") },
        },
      });
    }
    content.push({ text: userContent });
    const res = await this.client.send(
      new ConverseCommand({
        modelId: this.modelId,
        system: [{ text: system }],
        messages: [{ role: "user", content }] as unknown as Message[],
        inferenceConfig: { maxTokens: 1200, temperature: 0.4 },
      }),
    );
    return res.output?.message?.content?.map((c) => c.text ?? "").join("") ?? "";
  }

  async tutorChat(req: TutorRequest) {
    const system = [
      "You are Lumi, a warm, precise AI tutor for students aged 15–25.",
      `Explanation mode: ${req.mode}. In socratic mode, reply ONLY with a guiding question plus a small hint: never the full answer.`,
      "Adapt length to the mode: simple=short, detailed=structured with headings, exam-focused=crisp mark-scoring points, interview-focused=what an interviewer probes.",
      req.context
        ? `Student context you already know: ${req.context}`
        : "",
      "Use markdown, keep the tone friendly and encouraging.",
    ]
      .filter(Boolean)
      .join(" ");
    const history = (req.history ?? []).slice(-6);
    const reply = await this.converse(
      system,
      history.map((h) => `${h.role === "user" ? "Student" : "Lumi"}: ${h.content}`).join("\n") +
        `\nStudent: ${req.message}`,
    );
    return { reply: reply || (await this.demo.tutorChat(req)).reply, mode: req.mode };
  }

  async explain(topic: string, mode: ExplanationMode): Promise<Explanation> {
    const raw = await this.converse(
      "Return ONLY minified JSON matching: {topic, difficulty(beginner|intermediate|advanced), explanation, key_points:string[], misconceptions:string[], next_action(quiz|explain|practice|notes)}",
      `Explain "${topic}" in mode=${mode}.`,
    );
    return parseJson<Explanation>(raw) ?? this.demo.explain(topic, mode);
  }

  async generateQuiz(topic: string, weakConcepts?: string[]): Promise<Quiz> {
    const raw = await this.converse(
      'Return ONLY minified JSON matching: {topic, questions:[{id, question, type:"mcq", options:string[], correct_answer, explanation, concept}]}. 5 questions. concept = the precise sub-concept tested (e.g. "binary_search_boundary"). If weak concepts are given, weight questions toward them.',
      `Topic: ${topic}. Weak concepts: ${(weakConcepts ?? []).join(", ") || "none"}.`,
    );
    const parsed = parseJson<Quiz>(raw);
    return parsed?.questions?.length ? parsed : this.demo.generateQuiz(topic, weakConcepts);
  }

  async generateNotes(topic: string): Promise<Notes> {
    const raw = await this.converse(
      'Return ONLY minified JSON matching: {topic, quick_notes:string[], exam_sheet:string[], flashcards:[{question,answer}], common_mistakes:string[], sixty_second_explanation}',
      `Create revision material for: ${topic}.`,
    );
    return parseJson<Notes>(raw) ?? this.demo.generateNotes(topic);
  }

  async analyzeImage(params: {
    base64: string;
    mimeType: string;
    currentTopic?: string;
  }): Promise<ScanResult> {
    const raw = await this.converse(
      'You are Lumi\'s vision engine. Classify the image (textbook|handwriting|diagram|object|code) and return ONLY minified JSON: {topic, kind, concepts:string[], summary, mistakes?:[{step,issue,fix}], actions:["explain","quiz","notes","flashcards","add_to_plan"]}. For handwritten solutions, identify the EXACT step where the first mistake occurs and the misconception behind it.',
      `The student's current topic is: ${params.currentTopic ?? "unknown"}. Analyze this scan.`,
      { base64: params.base64, mimeType: params.mimeType },
    );
    return parseJson<ScanResult>(raw) ?? this.demo.analyzeImage(params);
  }

  async analyzeText(params: {
    text: string;
    currentTopic?: string;
  }): Promise<ScanResult> {
    const raw = await this.converse(
      'You are Lumi\'s document engine. The student uploaded a document. Return ONLY minified JSON: {topic, kind:"textbook", concepts:string[], summary, mistakes?:[{step,issue,fix}], actions:["explain","quiz","notes","flashcards","add_to_plan"]}. Identify the main topic, key concepts, and any worked examples or errors.',
      `Student topic: ${params.currentTopic ?? "unknown"}. Document text (truncated):\n\n${params.text.slice(0, 8000)}`,
    );
    return parseJson<ScanResult>(raw) ?? this.demo.analyzeText(params);
  }

  async generatePlan(input: {
    goal: string;
    days: number;
    dailyHours: number;
    weakConcepts: string[];
  }): Promise<StudyPlan> {
    const raw = await this.converse(
      'Return ONLY minified JSON: {goal, days:[{day, date:"YYYY-MM-DD", items:[{id, title, kind(learn|practice|revise|mock), done:false, reason?}]}]}. Schedule weak concepts for early reinforcement and spaced revision.',
      `Exam goal: ${input.goal}. Days available: ${input.days}. Daily hours: ${input.dailyHours}. Weak concepts: ${input.weakConcepts.join(", ") || "none"}.`,
    );
    return parseJson<StudyPlan>(raw) ?? this.demo.generatePlan(input);
  }
}

function parseJson<T>(raw: string): T | null {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(raw.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}
