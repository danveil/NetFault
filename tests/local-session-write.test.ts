import { afterEach, expect, it, vi } from "vitest";
import { rename } from "node:fs/promises";
import { assessmentAction, startAssessment } from "../src/server/sessions";
vi.mock("node:fs/promises", async (original) => {
  const fs = await original<typeof import("node:fs/promises")>();
  return { ...fs, rename: vi.fn(fs.rename) };
});
afterEach(() => vi.mocked(rename).mockReset());
async function resetRename() {
  const fs = await vi.importActual<typeof import("node:fs/promises")>("node:fs/promises");
  vi.mocked(rename).mockImplementation(fs.rename);
}
it.each(["EPERM", "EACCES", "EBUSY"])(
  "retries transient Windows %s without losing persisted commands",
  async (code) => {
    await resetRename();
    const a = await startAssessment(undefined, "port-security-01");
    vi.mocked(rename).mockClear();
    const error = Object.assign(new Error("temporarily busy"), { code });
    vi.mocked(rename).mockRejectedValueOnce(error).mockRejectedValueOnce(error);
    const operation = assessmentAction(a.id, "command", { device: "PC-A", command: "ipconfig", target: "" });
    if (process.platform !== "win32") {
      await expect(operation).rejects.toThrow("temporarily busy");
      return;
    }
    await operation;
    expect(rename).toHaveBeenCalledTimes(3);
    expect((await assessmentAction(a.id, "resume")).history).toHaveLength(1);
  },
);
it("fails after bounded contention and retains the previously committed attempt", async () => {
  await resetRename();
  const a = await startAssessment(undefined, "port-security-01");
  vi.mocked(rename).mockClear();
  vi.mocked(rename).mockRejectedValue(Object.assign(new Error("persistent lock"), { code: "EPERM" }));
  await expect(assessmentAction(a.id, "command", { device: "PC-A", command: "ipconfig", target: "" })).rejects.toThrow(
    "persistent lock",
  );
  expect(rename).toHaveBeenCalledTimes(process.platform === "win32" ? 5 : 1);
  await resetRename();
  expect((await assessmentAction(a.id, "resume")).history).toHaveLength(0);
});
it("does not retry other write errors or acknowledge failed state", async () => {
  await resetRename();
  const a = await startAssessment(undefined, "port-security-01");
  vi.mocked(rename).mockClear();
  vi.mocked(rename).mockRejectedValue(Object.assign(new Error("IO failure"), { code: "EIO" }));
  await expect(assessmentAction(a.id, "command", { device: "PC-A", command: "ipconfig", target: "" })).rejects.toThrow(
    "IO failure",
  );
  expect(rename).toHaveBeenCalledTimes(1);
  await resetRename();
  expect((await assessmentAction(a.id, "resume")).history).toHaveLength(0);
});
