import { test, expect } from "@playwright/test";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import path from "node:path";
import { neutralPublicSchema } from "../../src/lib/neutral-scenario";

// Isolated browser component harness, never a Next route, public asset or lab.
// Only neutral graph metadata enters this document; no private fixture imports.
const graph = neutralPublicSchema.parse({
  version: 1,
  id: "n-a17b93e2",
  title: "Operations segment",
  incident: "Investigate connectivity.",
  design: "Declared physical connections.",
  operations: ["access-assignment", "policy-order"],
  devices: ["Desk", "Access", "Local", "West", "East", "Archive"].map((id, index) => ({
    id,
    kind: id === "Access" ? "switch" : ["West", "East"].includes(id) ? "router" : "pc",
    role: "Network device",
    interfaces: id === "Access" ? ["Fa0/1", "Fa0/2", "Fa0/24"] : ["port-a", "port-b"],
    capabilities: id === "Access" ? ["access-switching"] : ["reachability"],
    desktop: { x: index === 2 ? 240 : (index > 2 ? index - 1 : index) * 240, y: index === 2 ? 220 : 0 },
    mobile: { x: 0, y: index * 200 },
  })),
  links: [
    ["Desk", "port-a", "Access", "Fa0/1"],
    ["Local", "port-a", "Access", "Fa0/2"],
    ["Access", "Fa0/24", "West", "port-a"],
    ["West", "port-b", "East", "port-a"],
    ["East", "port-b", "Archive", "port-a"],
  ].map(([a, ai, b, bi], index) => ({
    id: `edge-${index}`,
    kind: "physical",
    a: { device: a, interface: ai },
    b: { device: b, interface: bi },
    label: "link",
    ...(index === 2 ? { bend: { desktop: 0, mobile: -280 } } : {}),
  })),
});
test("neutral explicit topology renders and selects every renamed device without a registered challenge", async ({
  page,
}, info) => {
  const require = createRequire(path.join(process.cwd(), "package.json"));
  const { build } = require("esbuild") as typeof import("esbuild");
  const bundled = await build({
    stdin: {
      contents: `import React from 'react'; import { createRoot } from 'react-dom/client';
    import { ExplicitTopology } from './src/components/topology';
    function Harness(){const [selected,setSelected]=React.useState('Desk'); return <ExplicitTopology scenario={${JSON.stringify(graph)}} selected={selected} onSelect={setSelected}/>;}
    createRoot(document.getElementById('harness')).render(<Harness/>);`,
      loader: "tsx",
      resolveDir: process.cwd(),
    },
    bundle: true,
    write: false,
    outfile: "harness.js",
    jsx: "automatic",
    platform: "browser",
    define: { "process.env.NODE_ENV": '"production"' },
    plugins: [
      {
        name: "styles-separate",
        setup(build) {
          build.onLoad({ filter: /\.css$/ }, () => ({ contents: "", loader: "css" }));
        },
      },
    ],
  });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setContent(
    '<meta name="viewport" content="width=device-width, initial-scale=1"><main id="harness" style="max-width:1200px;margin:auto;padding:12px"></main>',
  );
  await page.addStyleTag({
    content:
      readFileSync("src/styles/base.css", "utf8") +
      readFileSync(require.resolve("@xyflow/react/dist/style.css"), "utf8"),
  });
  await page.addScriptTag({ content: bundled.outputFiles!.find((f) => f.path.endsWith(".js"))!.text });
  await expect(page.locator(".react-flow__node")).toHaveCount(6);
  await expect(page.locator(".react-flow__edge")).toHaveCount(5);
  const selector = page.getByRole("group", { name: "Topology device selection" });
  for (const d of graph.devices) {
    const button = selector.getByRole("button", { name: d.id, exact: true });
    await button.click();
    await expect(button).toHaveAttribute("aria-pressed", "true");
    const rect = await button.boundingBox();
    expect(rect!.height).toBeGreaterThanOrEqual(44);
    await expect(page.locator(`.react-flow__node[data-id="${d.id}"] .network-device`)).toHaveClass(/active/);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    page.viewportSize()!.width,
  );
  await page.screenshot({ path: info.outputPath("neutral-explicit-graph.png"), fullPage: true });
  expect(errors).toEqual([]);
});
