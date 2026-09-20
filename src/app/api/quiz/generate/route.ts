import { handleQuizGenerate } from "@/lib/quiz-service";

export async function POST(req: Request) {
  return handleQuizGenerate(req);
}
