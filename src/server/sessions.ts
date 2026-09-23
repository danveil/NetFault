import "server-only";
import { randomUUID } from "node:crypto";
import { type Attempt, type Diagnosis, type ScenarioId, type RepairAction } from "@/lib/schema";
import { recordRepair, trialNetwork } from "@/lib/repair-trial";
import { execute } from "@/lib/engine";
import { grade } from "@/lib/grading";
import { getScenario } from "./scenarios";
import { LabError, sessionStore, type SessionStore } from "./session-store";

export const ASSESSMENT_MS = 20 * 60 * 1000;
export async function startAssessment(store: SessionStore = sessionStore(), scenarioId: ScenarioId = "ospf-01") {
  const now = Date.now();
  const a: Attempt = {
    version: 1,
    id: randomUUID(),
    scenario: scenarioId,
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
  action: "resume" | "command" | "submit" | "repair",
  input?: { device: string; command: string; target: string; source?: string } | Diagnosis | RepairAction,
  store: SessionStore = sessionStore(),
) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id))
    throw new LabError("Invalid attempt ID");
  const observationId = randomUUID();
  return store.update(id, (a) => {
    const scenario = getScenario(a.scenario);
    const now = Date.now();
    if (!a.finishedAt && now >= a.expiresAt!) {
      const answer: Diagnosis = { cause: "unspecified", devices: [], fix: "unspecified", evidence: [], notes: "" };
      a.diagnosis = answer;
      a.finishedAt = a.expiresAt;
      a.feedback = grade(scenario, answer, a.history, true, a.repairs);
      return true;
    }
    if (a.finishedAt) return false;
    if (action === "repair") {
      try {
        Object.assign(a, recordRepair(scenario, a, input as RepairAction, now));
      } catch (error) {
        throw new LabError(error instanceof Error ? error.message : "Invalid configuration change");
      }
    }
    if (action === "command") {
      if (a.history.length >= 100)
        throw new LabError("This attempt has reached its 100-command limit. Review your evidence and submit.");
      const c = input as { device: string; command: string; target: string; source?: string };
      if (!scenario.devices.some((d) => d.id === c.device)) throw new LabError("Device is not part of this lab.");
      a.history.push({
        id: observationId,
        scenario: a.scenario,
        ...c,
        ...(a.repairs?.length ? { repairIndex: a.repairs.length } : {}),
        output: execute(trialNetwork(scenario, a.repairs), c.device, c.command, c.target, a.history, c.source),
        at: now,
      });
    }
    if (action === "submit") {
      a.diagnosis = input as Diagnosis;
      a.finishedAt = now;
      a.feedback = grade(scenario, a.diagnosis, a.history, false, a.repairs);
    }
    return action !== "resume";
  });
}
