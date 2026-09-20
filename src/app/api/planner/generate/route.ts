import { handlePlannerGenerate } from "@/lib/planner-service";

export async function POST(req: Request) {
  return handlePlannerGenerate(req);
}
