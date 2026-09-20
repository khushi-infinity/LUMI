import { handleQuizSubmit } from "@/lib/quiz-service";

export async function POST(req: Request) {
  return handleQuizSubmit(req);
}
