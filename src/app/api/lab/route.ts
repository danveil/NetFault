import { z } from "zod";
import { diagnosisSchema, scenarioIdSchema, repairActionSchema } from "@/lib/schema";
import { getScenario } from "@/server/scenarios";
import { assessmentAction, startAssessment } from "@/server/sessions";
import { LabError } from "@/server/session-store";
export const runtime = "nodejs";
const requestSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("practice-pack"), scenario: scenarioIdSchema.default("ospf-01") }),
  z.object({ action: z.literal("start"), scenario: scenarioIdSchema.default("ospf-01") }),
  z.object({ action: z.literal("resume"), id: z.string().uuid() }),
  z.object({ action: z.literal("repair"), id: z.string().uuid(), change: repairActionSchema }),
  z.object({
    action: z.literal("command"),
    id: z.string().uuid(),
    device: z.enum(["PC-A", "R1", "R2", "R3", "SW1", "SW2", "PC-B"]),
    command: z.string().max(100),
    target: z.string().max(64),
    source: z.string().max(64).optional(),
  }),
  z.object({ action: z.literal("submit"), id: z.string().uuid(), diagnosis: diagnosisSchema }),
]);
function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "CDN-Cache-Control": "no-store",
      "Netlify-CDN-Cache-Control": "no-store",
    },
  });
}
export async function POST(request: Request) {
  try {
    // Next may use the bind address (0.0.0.0) in request.url; compare the browser origin to the actual Host header.
    const origin = request.headers.get("origin");
    if (origin) {
      let originHost: string;
      try {
        originHost = new URL(origin).host;
      } catch {
        return json({ error: "Invalid request origin." }, 403);
      }
      if (originHost !== request.headers.get("host"))
        return json({ error: "Cross-origin requests are not allowed." }, 403);
    }
    if (!request.headers.get("content-type")?.startsWith("application/json"))
      return json({ error: "Use application/json." }, 415);
    if (Number(request.headers.get("content-length")) > 30000) return json({ error: "Request too large." }, 413);
    const reader = request.body?.getReader();
    const chunks: Uint8Array[] = [];
    let bytes = 0;
    if (reader) {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        bytes += value.byteLength;
        if (bytes > 30000) {
          await reader.cancel();
          return json({ error: "Request too large." }, 413);
        }
        chunks.push(value);
      }
    }
    const raw = Buffer.concat(chunks).toString("utf8");
    const parsed = requestSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return json({ error: "Invalid lab request." }, 400);
    const p = parsed.data;
    if (p.action === "practice-pack") return json({ pack: getScenario(p.scenario) });
    if (p.action === "start") return json({ attempt: await startAssessment(undefined, p.scenario) });
    if (p.action === "repair") return json({ attempt: await assessmentAction(p.id, "repair", p.change) });
    if (p.action === "command")
      return json({
        attempt: await assessmentAction(p.id, "command", {
          device: p.device,
          command: p.command.trim().toLowerCase().replace(/\s+/g, " "),
          target: p.target.trim(),
          ...(p.source ? { source: p.source.trim() } : {}),
        }),
      });
    if (p.action === "submit") return json({ attempt: await assessmentAction(p.id, "submit", p.diagnosis) });
    return json({ attempt: await assessmentAction(p.id, "resume") });
  } catch (e) {
    return json(
      {
        error:
          e instanceof SyntaxError
            ? "Invalid JSON."
            : e instanceof LabError
              ? e.message
              : "Assessment service is unavailable. Please retry.",
      },
      e instanceof SyntaxError ? 400 : e instanceof LabError ? e.status : 503,
    );
  }
}
