import { handlePlannerUpdate } from "@/lib/planner-service";

export async function PATCH(req: Request) {
  return handlePlannerUpdate(req);
}

export async function POST(req: Request) {
  return handlePlannerUpdate(req);
}
