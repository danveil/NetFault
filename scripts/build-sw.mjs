import { readFile, writeFile } from "node:fs/promises";
const id = (await readFile(".next/BUILD_ID", "utf8")).trim();
const template = await readFile("scripts/service-worker.js", "utf8");
await writeFile("public/sw.js", template.replaceAll("__BUILD_ID__", id));
console.log(`Generated offline worker for build ${id}`);
