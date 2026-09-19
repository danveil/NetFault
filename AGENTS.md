<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# NetFault engineering contract

Scope: Milestone 1 and 1.5 Netlify deployment readiness only, one fully playable OSPF area-mismatch lab. Do not begin Milestone 2, add scenarios or start the roadmap without explicit authorization. This nested folder is independent of the parent portfolio and sibling CaptainOS projects. Never modify their code to make NetFault work.

- Use strict TypeScript, deterministic scenario-driven state, validated versioned schemas and explicit device-appropriate supported commands. No LLM gameplay output or arbitrary free-text grading.
- The scenario is the source of truth. Derive neighbors, routes, connectivity and every command output from it. Read `docs/network-correctness.md` before changing network behavior. Explicit point-to-point transit type, passive LANs, unique router IDs, correct source/return routing and no accidental second fault are required.
- Preserve the exact PC-A–R1–R2–R3–PC-B topology and prescribed addressing. The sole intended defect is R3 Gi0/0 area 1 against R2 area 0. Link colors must not reveal faults.
- Keep fault metadata, accepted repairs, evidence rules, hints and explanations in server-only scenario modules. Initial/active assessment payloads and static client assets must not contain private answers. Practice pack is explicitly downloaded, inspectable and offline-capable. Disclose that this is self-assessment, not tamper-proof testing.
- Assessment commands, evidence history, deadlines and final grades are server-owned. No hint/reveal during an active attempt. Expired or finalized sessions cannot be amended. Do not cache assessment APIs in the service worker.
- Grade structured cause, exact adjacency endpoints, server-recorded evidence and accepted repair. Notes are saved but not graded. Never claim language understanding from keywords.
- Preserve the journal fields and local storage versioning. Do not overwrite corrupt data or silently discard persistence failures. No destructive data changes, deployment, commits or pushes without explicit authorization.
- Teach concepts with all seven parts: simple, bounded analogy, technical, worked example, symptom, guided practice and independent exercise. Do not invent credentials, university endorsement, completion or mastery metrics.
- Keep mobile controls touch-sized, output panes readable/scrollable, focus visible and diagram alternatives accessible. Test 414 CSS pixels and desktop. Never claim physical iPhone testing or external network lab validation unless actually performed.
- Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:browser`, `pnpm build`, and production offline browser tests for relevant changes. Do not reuse a dev server for production service-worker testing. Record actual results, failures and limitations in `docs/verification.md`.
- Windows PowerShell is the supported local shell. Use pnpm in this folder. Do not delete sibling artifacts, change firewall/certificates, or expose the server publicly as part of routine tests.
- Review the architecture, scenario-authoring and iPhone documents before extending behavior. Keep the Next.js-generated instructions above intact.
- Read `docs/NETLIFY_DEPLOYMENT.md` and `docs/deployment-audit.md` before hosting changes. Use automatically managed OpenNext, Node 24, pinned pnpm packageManager and frozen lockfile. No static export, SPA fallback or pinned adapter plugin. Check current official Netlify documentation.
- Hosted assessment storage must remain durable across invocations: site-scoped Blobs, strong reads, conditional ETag writes and conflict re-evaluation. No cloud filesystem fallback or process-only locks. Preserve immutable final grades and server deadlines. Do not weaken ETag guards for the local SDK emulator, which currently omits GET ETags. No required application secrets; never expose credentials in NEXT_PUBLIC variables.
- Keep API responses no-store at browser/CDN/Netlify layers and out of the worker. Source worker is `scripts/service-worker.js`; build generates `public/sw.js` with a unique build ID. Install complete snapshots atomically, offer safe reloads and test real production offline/update behavior.
- No account connection, site linking, public deployment, paid infrastructure, commits or pushes without user authorization. Keep production and preview storage separate when previews are enabled. Record local-tooling limits separately from actual cloud or iPhone verification.
