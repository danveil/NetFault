import "server-only";
import { randomUUID } from "node:crypto";
import { type Attempt, type Diagnosis } from "@/lib/schema";
import { execute } from "@/lib/engine";
import { grade } from "@/lib/grading";
import { scenario } from "./scenario";
import { LabError, sessionStore, type SessionStore } from "./session-store";

export const ASSESSMENT_MS = 20 * 60 * 1000;
export async function startAssessment(store: SessionStore = sessionStore()) {
  const now = Date.now();
  const a: Attempt = {
    version: 1,
    id: randomUUID(),
    scenario: "ospf-01",
    mode: "assessment",
    startedAt: now,
    expiresAt: now + ASSESSMENT_MS,
    history: [],
    hints: [],
    revealed: false,
  };
  await store.create(a);
  return a;
}
export async function assessmentAction(
  id: string,
  action: "resume" | "command" | "submit",
  input?: { device: string; command: string; target: string } | Diagnosis,
  store: SessionStore = sessionStore(),
) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id))
    throw new LabError("Invalid attempt ID");
  const observationId = randomUUID();
  return store.update(id, (a) => {
    const now = Date.now();
    if (!a.finishedAt && now >= a.expiresAt!) {
      const answer: Diagnosis = { cause: "unspecified", devices: [], fix: "unspecified", evidence: [], notes: "" };
      a.diagnosis = answer;
      a.finishedAt = a.expiresAt;
      a.feedback = grade(scenario, answer, a.history, true);
      return true;
    }
    if (a.finishedAt) return false;
    if (action === "command") {
      if (a.history.length >= 100)
        throw new LabError("This attempt has reached its 100-command limit. Review your evidence and submit.");
      const c = input as { device: string; command: string; target: string };
      a.history.push({ id: observationId, ...c, output: execute(scenario, c.device, c.command, c.target), at: now });
    }
    if (action === "submit") {
      a.diagnosis = input as Diagnosis;
      a.finishedAt = now;
      a.feedback = grade(scenario, a.diagnosis, a.history);
    }
    return action !== "resume";
  });
}
