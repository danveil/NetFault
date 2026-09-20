import { test, expect, type Page } from "@playwright/test";

async function open(page: Page, assessment = false) {
  await page.goto("/");
  await page.getByRole("button", { name: /LAB 005.*The Silent OSPF Interface/ }).click();
  if (assessment) await page.getByRole("button", { name: "Assessment 20 minutes.", exact: false }).click();
  await page.getByRole("button", { name: "Start investigation" }).click();
  await expect(page.getByRole("heading", { name: "The Silent OSPF Interface", exact: true })).toBeVisible();
}
async function run(page: Page, device: string, command: string) {
  await page.getByRole("button", { name: device, exact: true }).click();
  await page.getByRole("button", { name: command, exact: true }).click();
  return page.getByRole("region", { name: "Command output" });
}
async function collect(page: Page, alternative = false) {
  const commands = alternative
    ? [
        ["R2", "show running-config"],
        ["R2", "show ip interface brief"],
        ["R2", "show ip ospf neighbor"],
        ["R2", "show ip route"],
      ]
    : [
        ["R2", "show ip ospf interface"],
        ["R2", "show ip ospf neighbor"],
        ["R3", "show ip route"],
      ];
  for (const [device, command] of commands) {
    await run(page, device, command);
    await page.getByRole("button", { name: "Select output as evidence", exact: true }).click();
  }
}
async function diagnose(page: Page) {
  await page.getByRole("tab", { name: "Diagnose", exact: false }).click();
  await page.getByLabel("01 / Root cause").selectOption("passive-interface");
  await page.getByLabel("R2", { exact: true }).check();
  await page.getByLabel("Affected interface").selectOption("Gi0/1");
  await page.getByLabel("03 / Proposed remediation").selectOption("no-passive");
  await page.getByLabel("Why does the correction work?").selectOption("hello-adjacency");
  await page
    .getByLabel("Your reasoning", { exact: false })
    .fill(
      "R2's transit is up in area 0 but sends no Hellos. Enable Hellos there to establish adjacency and learn both remote LANs; retain the passive LANs.",
    );
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    page.viewportSize()!.width,
  );
  await page.getByRole("button", { name: "Submit diagnosis", exact: true }).click();
  await expect(page.getByRole("heading", { name: "A diagnosis backed by evidence." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "6. Independent practice", exact: true })).toBeVisible();
  const solution = page.getByText(/Cedar Gi0\/0 is the incorrect passive transit/);
  await expect(solution).not.toBeVisible();
  await page.getByText("7. Independent exercise solution — reveal when ready", { exact: true }).click();
  await expect(solution).toBeVisible();
}
async function preview(page: Page) {
  await page.getByRole("button", { name: "Verify repaired network" }).click();
  const output = page.locator(".preview");
  await expect(output).toContainText("No Hellos (Passive interface)");
  await expect(output).toContainText("Hellos enabled (timing not simulated)");
  await expect(output).toContainText("3.3.3.3");
  await expect(output).toContainText("FULL/-");
  await expect(output).toContainText("192.168.30.0/24 [110/3]");
  await expect(output).toContainText("192.168.10.0/24 [110/3]");
  const after = (await output.innerText()).split("AFTER REPAIR")[1];
  expect(after.split("R2> show ip ospf interface")[0]).not.toContain("passive-interface Gi0/1");
  await expect(output).toContainText("Passive Interface(s): Gi0/0");
  await expect(output).toContainText("Passive Interface(s): Gi0/1");
  await expect(output).toContainText("100 percent");
  await expect(output).toContainText("4  192.168.30.10");
  await expect(output).not.toContainText("Unsupported");
}

test("passive practice: all devices, Hello evidence, hints, repair, lesson and saved progress", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await open(page);
  await expect(page.locator(".incident")).not.toContainText("R2 Gi0/1 is passive");
  await expect(await run(page, "PC-A", "ipconfig /all")).toContainText("192.168.10.1");
  await page.getByLabel("Destination IPv4").fill("192.168.10.1");
  await expect(await run(page, "PC-A", "ping")).toContainText("100 percent");
  await page.getByLabel("Destination IPv4").fill("192.168.30.10");
  await expect(await run(page, "PC-A", "ping")).toContainText("0 percent (0/5)");
  await expect(await run(page, "PC-A", "tracert")).toContainText("!H");
  await expect(await run(page, "R1", "show ip ospf neighbor")).toContainText("2.2.2.2");
  await expect(await run(page, "R1", "show ip route")).toContainText("10.0.23.0/30 [110/2]");
  for (const router of ["R1", "R2", "R3"]) {
    await expect(await run(page, router, "show ip interface brief")).toContainText("up      up");
    await expect(await run(page, router, "show ip ospf interface")).toContainText("Area 0");
  }
  await expect(await run(page, "R2", "show running-config")).toContainText("passive-interface Gi0/1");
  await expect(await run(page, "R2", "show ip protocols")).toContainText("Gi0/1");
  await page.getByLabel("Destination IPv4").fill("10.0.23.2");
  await expect(await run(page, "R2", "ping")).toContainText("100 percent");
  await page.getByLabel("Ping source (optional)").fill("Gi0/0");
  await page.getByRole("button", { name: "ping", exact: true }).click();
  await expect(page.getByRole("region", { name: "Command output" })).toContainText("0 percent (0/5)");
  await expect(await run(page, "PC-B", "ipconfig")).toContainText("192.168.30.1");
  await page.getByLabel("Destination IPv4").fill("192.168.10.10");
  await expect(await run(page, "PC-B", "ping")).toContainText("0 percent (0/5)");
  await collect(page);
  for (let i = 0; i < 4; i++) await page.getByRole("button", { name: `Next hint (${i}/4)`, exact: true }).click();
  await expect(page.getByRole("button", { name: "Next hint (4/4)", exact: true })).toBeDisabled();
  for (const button of await page.locator(".command-button").all())
    expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    page.viewportSize()!.width,
  );
  await page.screenshot({ path: info.outputPath("passive-inspection.png"), fullPage: true });
  await diagnose(page);
  await preview(page);
  await page.screenshot({ path: info.outputPath("passive-feedback.png"), fullPage: true });
  await page.reload();
  await page.getByRole("button", { name: "Your journal" }).click();
  const entry = page.locator(".journal-entry").filter({ hasText: "The Silent OSPF Interface" });
  await expect(entry).toContainText("100/100");
  await expect(entry).toContainText("4 hints");
  await entry.getByRole("button", { name: "Open attempt" }).click();
  await page.getByText("Your submitted diagnosis & reasoning", { exact: true }).click();
  await expect(page.locator("details").filter({ hasText: "Your submitted diagnosis & reasoning" })).toContainText(
    "Gi0/1",
  );
  await page.getByRole("tab", { name: /Evidence/ }).click();
  await expect(page.locator(".observation").filter({ hasText: "source Gi0/0" })).toHaveCount(1);
  expect(errors).toEqual([]);
});

test("passive assessment resumes server history and grades alternative supporting evidence", async ({ page }) => {
  await open(page, true);
  await expect(page.getByText("remaining", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /Next hint/ })).toHaveCount(0);
  await run(page, "R2", "show ip interface brief");
  await page.getByLabel("Destination IPv4").fill("10.0.23.2");
  await page.getByLabel("Ping source (optional)").fill("10.0.12.2");
  await page.getByRole("button", { name: "ping", exact: true }).click();
  await page.reload();
  await page.getByRole("tab", { name: /Evidence/ }).click();
  const source = page.locator(".observation").filter({ hasText: "source 10.0.12.2" });
  await source.getByText("Read command output").click();
  await expect(source).toContainText("0 percent (0/5)");
  await page.getByRole("tab", { name: /Investigate/ }).click();
  await collect(page, true);
  await diagnose(page);
  await preview(page);
});

test("five cached labs reopen offline and passive practice completes without API access", async ({ page, context }) => {
  test.skip(!process.env.PW_PRODUCTION, "Production offline worker only.");
  await open(page);
  await collect(page);
  for (const label of [
    /LAB 001.*The silent route/,
    /LAB 002.*Beyond the local network/,
    /LAB 003.*The Wrong Network/,
    /LAB 004.*The Missing Return Path/,
  ]) {
    await page.getByRole("button", { name: "Lab bench (attempt saved)" }).click();
    await page.getByRole("button", { name: label }).click();
    await page.getByRole("button", { name: "Start investigation" }).click();
    await run(page, "PC-A", "ipconfig");
  }
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await context.setOffline(true);
  for (const title of [
    "The silent route",
    "Beyond the local network",
    "The Wrong Network",
    "The Missing Return Path",
    "The Silent OSPF Interface",
  ]) {
    await page.getByRole("button", { name: "Your journal" }).click();
    await expect(page.locator(".journal-entry")).toHaveCount(5);
    await page
      .locator(".journal-entry")
      .filter({ hasText: title })
      .getByRole("button", { name: "Open attempt" })
      .click();
    await page.reload();
    await expect(await run(page, "PC-A", "ipconfig")).toContainText("192.168.10.10");
  }
  await diagnose(page);
  await preview(page);
  await page.reload();
  await page.getByRole("button", { name: "Your journal" }).click();
  await expect(page.locator(".journal-entry").filter({ hasText: "The Silent OSPF Interface" })).toContainText(
    "100/100",
  );
  await context.setOffline(false);
});

test("initial passive assessment and client assets exclude private answers", async ({ page, request }) => {
  const response = await request.post("/api/lab", { data: { action: "start", scenario: "passive-01" } });
  for (const header of ["cache-control", "cdn-cache-control", "netlify-cdn-cache-control"])
    expect(response.headers()[header]).toBe("no-store");
  const { attempt } = await response.json();
  expect(attempt.scenario).toBe("passive-01");
  expect(attempt.history).toEqual([]);
  expect(attempt.hints).toEqual([]);
  for (const key of ["fault", "repair", "lesson", "feedback", "evidenceRules"]) expect(attempt).not.toHaveProperty(key);
  await page.goto("/");
  const forbidden = [
    "no passive-interface Gi0/1",
    "R2 Gi0/1 is physically up and in area 0, but",
    "Cedar Gi0/0 is the incorrect passive transit",
  ];
  for (const text of forbidden) expect(await page.content()).not.toContain(text);
  for (const src of await page
    .locator("script[src]")
    .evaluateAll((nodes) => nodes.map((n) => (n as HTMLScriptElement).src))) {
    const js = await (await request.get(src)).text();
    for (const text of forbidden) expect(js).not.toContain(text);
  }
});
