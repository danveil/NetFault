import type { Exercise } from "./schema";
import { z } from "zod";

// Deliberately decimal: reject ambiguous leading zeros; normalize outer whitespace only.
export function normalizeIPv4(value: string): string | undefined {
  const input = value.trim();
  if (!/^(0|[1-9]\d{0,2})(\.(0|[1-9]\d{0,2})){3}$/.test(input)) return;
  if (input.split(".").some((n) => Number(n) > 255)) return;
  return input;
}
export function subnet(address: string, prefix: number) {
  const ip = normalizeIPv4(address);
  if (!ip || !Number.isInteger(prefix) || prefix < 1 || prefix > 30)
    throw Error("Pilot supports prefixes /1 through /30 only");
  const number = ip.split(".").reduce((sum, octet) => sum * 256 + Number(octet), 0);
  const size = 2 ** (32 - prefix),
    start = Math.floor(number / size) * size;
  const dotted = (n: number) => [24, 16, 8, 0].map((shift) => (n >>> shift) & 255).join(".");
  return {
    network: dotted(start),
    broadcast: dotted(start + size - 1),
    first: dotted(start + 1),
    last: dotted(start + size - 2),
    hosts: size - 2,
  };
}
export function gradeExercise(exercise: Exercise, input: unknown) {
  const parsed = z.record(z.string(), z.string().max(500)).safeParse(input);
  if (!parsed.success) return { valid: false as const, errors: ["Enter valid answers in the provided fields."] };
  const errors: string[] = [],
    normalized: Record<string, string> = {},
    feedback: string[] = [];
  let correct = true;
  for (const field of exercise.fields) {
    const raw = parsed.data[field.id] ?? "";
    let value = raw.trim();
    if (field.kind === "ipv4") {
      const ip = normalizeIPv4(raw);
      if (!ip) errors.push(`${field.label}: enter four decimal octets from 0 to 255, without leading zeros.`);
      else value = ip;
    } else if (field.kind === "number") {
      if (!/^\d{1,10}$/.test(value)) errors.push(`${field.label}: enter a whole non-negative number.`);
      else value = String(Number(value));
    } else if (!field.choices.includes(value)) errors.push(`${field.label}: select an option.`);
    normalized[field.id] = value;
    const match = value === String(field.answer);
    correct &&= match;
    feedback.push(`${field.label}: ${match ? "Correct." : "Review this answer."} ${field.explanation}`);
  }
  if (errors.length) return { valid: false as const, errors };
  return { valid: true as const, correct, answers: normalized, feedback };
}
