import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import type { MemoryStore } from "@/lib/memory/store";
import type { ConceptMastery, LearningEvent, PlanItem, StudentProfile } from "@/lib/types";

/**
 * DynamoDBStore — production memory (spec §32).
 * Single-table design keyed on student_id:
 *   PK=student#<id>  SK=profile|plan|mastery#<concept>|event#<ts>
 * Env: DYNAMODB_TABLE_NAME
 */
export class DynamoDBStore implements MemoryStore {
  private doc: DynamoDBDocumentClient;
  private table: string;
  private studentId: string;

  constructor(studentId = "demo-student") {
    const client = new DynamoDBClient({ region: process.env.AWS_REGION });
    this.doc = DynamoDBDocumentClient.from(client);
    this.table = process.env.DYNAMODB_TABLE_NAME || "lumi-student-state";
    this.studentId = studentId;
  }

  private get pk() {
    return `student#${this.studentId}`;
  }

  async getProfile(): Promise<StudentProfile> {
    const res = await this.doc.send(
      new GetCommand({ TableName: this.table, Key: { PK: this.pk, SK: "profile" } }),
    );
    return (res.Item?.profile as StudentProfile) ?? {
      name: "Student",
      grade: "",
      subjects: [],
      goals: [],
      streak: 0,
      minutes_today: 0,
      daily_goal_minutes: 180,
    };
  }

  async getPlan(): Promise<PlanItem[]> {
    const res = await this.doc.send(
      new GetCommand({ TableName: this.table, Key: { PK: this.pk, SK: "plan" } }),
    );
    return (res.Item?.items as PlanItem[]) ?? [];
  }

  async setPlan(items: PlanItem[]): Promise<void> {
    await this.doc.send(
      new PutCommand({ TableName: this.table, Item: { PK: this.pk, SK: "plan", items } }),
    );
  }

  async getMastery(): Promise<ConceptMastery[]> {
    const res = await this.doc.send(
      new QueryCommand({
        TableName: this.table,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
        ExpressionAttributeValues: { ":pk": this.pk, ":prefix": "mastery#" },
      }),
    );
    return (res.Items ?? []) as ConceptMastery[];
  }

  async updateMastery(concept: string, correct: boolean): Promise<void> {
    await this.doc.send(
      new UpdateCommand({
        TableName: this.table,
        Key: { PK: this.pk, SK: `mastery#${concept}` },
        UpdateExpression:
          "ADD attempts :one, correct :c, incorrect :w SET last_reviewed = :now",
        ExpressionAttributeValues: {
          ":one": 1,
          ":c": correct ? 1 : 0,
          ":w": correct ? 0 : 1,
          ":now": new Date().toISOString(),
        },
      }),
    );
    await this.logEvent(correct ? "ANSWER_CORRECT" : "ANSWER_WRONG", concept);
  }

  async addMinutesLearning(minutes: number): Promise<void> {
    await this.doc.send(
      new UpdateCommand({
        TableName: this.table,
        Key: { PK: this.pk, SK: "profile" },
        UpdateExpression: "ADD minutes_today :m",
        ExpressionAttributeValues: { ":m": minutes },
      }),
    );
  }

  async logEvent(type: LearningEvent["type"], detail: string): Promise<void> {
    await this.doc.send(
      new PutCommand({
        TableName: this.table,
        Item: {
          PK: this.pk,
          SK: `event#${Date.now()}`,
          type,
          detail,
          at: new Date().toISOString(),
        },
      }),
    );
  }

  async getEvents(limit = 20): Promise<LearningEvent[]> {
    const res = await this.doc.send(
      new QueryCommand({
        TableName: this.table,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
        ExpressionAttributeValues: { ":pk": this.pk, ":prefix": "event#" },
        ScanIndexForward: false,
        Limit: limit,
      }),
    );
    return (res.Items ?? []) as LearningEvent[];
  }
}
