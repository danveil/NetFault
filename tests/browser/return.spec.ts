import { test, expect, type Page } from "@playwright/test";

async function open(page: Page, assessment = false) {
  await page.goto("/");
  await page.getByRole("button", { name: /LAB 004.*The Missing Return Path/ }).click();
  if (assessment) await page.getByRole("button", { name: "Assessment 20 minutes.", exact: false }).click();
  await page.getByRole("button", { name: "Start investigation" }).click();
  await expect(page.getByRole("heading", { name: "The Missing Return Path", exact: true })).toBeVisible();
}
async function run(page: Page, device: string, command: string) {
  await page.getByRole("button", { name: device, exact: true }).click();
  await page.getByRole("button", { name: command, exact: true }).click();
  return page.getByRole("region", { name: "Command output" });
}
async function evidence(page: Page) {
  await page.getByRole("button", { name: "Select output as evidence", exact: true }).click();
}
async function collect(page: Page) {
  for (const [device, command] of [
    ["R2", "show ip route"],
    ["PC-A", "ipconfig"],
    ["R1", "show ip route"],
  ]) {
    await run(page, device, command);
    await evidence(page);
  }
}
async function diagnose(page: Page) {
  await page.getByRole("tab", { name: "Diagnose", exact: false }).click();
  await page.getByLabel("01 / Root cause").selectOption("missing-route");
  await page.getByLabel("R2", { exact: true }).check();
  await page.getByLabel("Missing destination network (CIDR)").fill("192.168.10.0/24");
  await page.getByLabel("Proposed next-hop IPv4 address").fill("10.0.12.1");
  await page.getByLabel("Why does the correction work?").selectOption("reply-route");
  await page.getByLabel("03 / Proposed remediation").selectOption("static-route");
  await page
    .getByLabel("Your reasoning", { exact: false })
    .fill(
      "R1 can deliver the request, but R2 has no route for the reply destination. Local ping alone did not check that path.",
    );
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    page.viewportSize()!.width,
  );
  await page.getByRole("button", { name: "Submit diagnosis", exact: true }).click();
  await expect(page.getByRole("heading", { name: "A diagnosis backed by evidence." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "6. Independent practice", exact: true })).toBeVisible();
  const solution = page.getByText(/Maple needs ip route 172.16.4.0/);
  await expect(solution).not.toBeVisible();
  await page.getByText("7. Independent exercise solution — reveal when ready", { exact: true }).click();
  await expect(solution).toBeVisible();
}
async function preview(page: Page) {
  await page.getByRole("button", { name: "Verify repaired network" }).click();
  const output = page.locator(".preview");
  await expect(output).toContainText("R2: no route to destination");
  await expect(output).toContainText("ip route 192.168.10.0 255.255.255.0 10.0.12.1");
  await expect(output).toContainText("Bidirectional communication: successful");
  await expect(output).toContainText(
    "Reply 192.168.20.10 -> 192.168.10.10: 192.168.20.1 -> 10.0.12.1 -> 192.168.10.10; Delivered",
  );
  await expect(output).toContainText("100 percent");
  await expect(output).toContainText("3  192.168.20.10");
  await expect(output).not.toContainText("Unsupported");
}

test("return-path practice: all devices, source-sensitive probes, evidence, teaching, repair and journal", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await open(page);
  await expect(page.locator(".incident")).not.toContainText("R2 lacks");
  await expect(await run(page, "PC-A", "ipconfig /all")).toContainText("192.168.10.1");
  await page.getByLabel("Destination IPv4").fill("192.168.10.1");
  await expect(await run(page, "PC-A", "ping")).toContainText("100 percent");
  await page.getByLabel("Destination IPv4").fill("192.168.20.10");
  await expect(await run(page, "PC-A", "ping")).toContainText("0 percent (0/5)");
  await expect(await run(page, "PC-A", "tracert")).toContainText("1  192.168.10.1\n2  * * *\n3  * * *");
  await expect(await run(page, "SW1", "show vlan brief")).toContainText("Gi0/1, Gi0/2");
  await expect(await run(page, "SW1", "show interfaces status")).toContainText("connected");
  await expect(await run(page, "SW1", "show running-config")).toContainText("switchport access vlan 10");
  for (const router of ["R1", "R2"]) {
    await expect(await run(page, router, "show ip interface brief")).toContainText("up      up");
    await expect(await run(page, router, "show running-config")).not.toContainText("router ospf");
  }
  await expect(await run(page, "R1", "ping")).toContainText("100 percent");
  await page.getByLabel("Ping source (optional)").fill("Gi0/0");
  await page.getByRole("button", { name: "ping", exact: true }).click();
  await expect(page.getByRole("region", { name: "Command output" })).toContainText("source 192.168.10.1");
  await expect(page.getByRole("region", { name: "Command output" })).toContainText("0 percent (0/5)");
  await expect(await run(page, "PC-B", "ipconfig")).toContainText("192.168.20.1");
  await page.getByLabel("Destination IPv4").fill("192.168.10.10");
  await expect(await run(page, "PC-B", "ping")).toContainText("0 percent (0/5)");
  await collect(page);
  for (let i = 0; i < 4; i++) await page.getByRole("button", { name: `Next hint (${i}/4)`, exact: true }).click();
  await expect(page.getByRole("button", { name: "Next hint (4/4)", exact: true })).toBeDisabled();
  for (const box of await page.locator(".command-button").all())
    expect((await box.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    page.viewportSize()!.width,
  );
  await page.screenshot({ path: info.outputPath("return-routing-inspection.png"), fullPage: true });
  await diagnose(page);
  await preview(page);
  await page.screenshot({ path: info.outputPath("return-feedback.png"), fullPage: true });
  await page.reload();
  await page.getByRole("button", { name: "Your journal" }).click();
  const entry = page.locator(".journal-entry").filter({ hasText: "The Missing Return Path" });
  await expect(entry).toContainText("100/100");
  await expect(entry).toContainText("4 hints");
  await entry.getByRole("button", { name: "Open attempt" }).click();
  await page.getByText("Your submitted diagnosis & reasoning", { exact: true }).click();
  await expect(page.locator("details").filter({ hasText: "Your submitted diagnosis & reasoning" })).toContainText(
    "10.0.12.1",
  );
  await page.getByRole("tab", { name: /Evidence/ }).click();
  await expect(page.locator(".observation").filter({ hasText: "source Gi0/0" })).toHaveCount(1);
  expect(errors).toEqual([]);
});

test("return-path assessment preserves sources across reload and server-grades evidence", async ({ page }) => {
  await open(page, true);
  await expect(page.getByText("remaining", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /Next hint/ })).toHaveCount(0);
  await run(page, "R1", "show ip interface brief");
  await page.getByLabel("Ping source (optional)").fill("192.168.10.1");
  await page.getByRole("button", { name: "ping", exact: true }).click();
  await page.reload();
  await page.getByRole("tab", { name: /Evidence/ }).click();
  const source = page.locator(".observation").filter({ hasText: "source 192.168.10.1" });
  await source.getByText("Read command output").click();
  await expect(source).toContainText("0 percent (0/5)");
  await page.getByRole("tab", { name: /Investigate/ }).click();
  await collect(page);
  await diagnose(page);
  await preview(page);
});

test("four cached labs reopen offline and the return-path lab completes without API access", async ({
  page,
  context,
}) => {
  test.skip(!process.env.PW_PRODUCTION, "Production offline worker only.");
  await open(page);
  await collect(page);
  for (const label of [
    /LAB 001.*The silent route/,
    /LAB 002.*Beyond the local network/,
    /LAB 003.*The Wrong Network/,
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
  ]) {
    await page.getByRole("button", { name: "Your journal" }).click();
    await expect(page.locator(".journal-entry")).toHaveCount(4);
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
  await expect(page.locator(".journal-entry").filter({ hasText: "The Missing Return Path" })).toContainText("100/100");
  await context.setOffline(false);
});

test("initial return-path assessment and client assets contain no private repair or lesson", async ({
  page,
  request,
}) => {
  const response = await request.post("/api/lab", { data: { action: "start", scenario: "return-01" } });
  for (const header of ["cache-control", "cdn-cache-control", "netlify-cdn-cache-control"])
    expect(response.headers()[header]).toBe("no-store");
  const { attempt } = await response.json();
  expect(attempt.scenario).toBe("return-01");
  expect(attempt.history).toEqual([]);
  expect(attempt.hints).toEqual([]);
  for (const key of ["fault", "repair", "lesson", "feedback", "evidenceRules"]) expect(attempt).not.toHaveProperty(key);
  await page.goto("/");
  const forbidden = [
    "ip route 192.168.10.0 255.255.255.0 10.0.12.1",
    "Maple needs ip route",
    "Required reply destination and R2 route coverage",
  ];
  for (const text of forbidden) expect(await page.content()).not.toContain(text);
  for (const src of await page
    .locator("script[src]")
    .evaluateAll((nodes) => nodes.map((n) => (n as HTMLScriptElement).src))) {
    const js = await (await request.get(src)).text();
    for (const text of forbidden) expect(js).not.toContain(text);
  }
});
