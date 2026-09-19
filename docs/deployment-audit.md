# Milestone 1.5 audit and execution plan

Scope: prepare the existing one-lab application for Netlify. No public deployment, account connection, commits, parent-project edits, or Milestone 2.

## Plan

1. Inspect source, dependencies, Next.js guides, server routes, persistence, service worker, tests and existing documentation; compare with current official Netlify guidance.
2. Preserve the engine, scenario, grading, journal schema and local workflow. Replace only hosted assessment storage with strong, conditional site-scoped Blobs operations.
3. Configure Node/pnpm/lockfile and automatic OpenNext; version offline snapshots per build and provide an update action.
4. Add regression coverage, run lint/type/unit/build/desktop/mobile/offline tests and attempt an unlinked Netlify local build.
5. Record evidence, limitations, deployment settings, iPhone checks and rollback steps.

## Findings and decisions

| Area            | Audit finding / action                                                                                                                                                                                                                                                                                          |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework       | Next 16.3.1 App Router uses a Node route handler. Supported by automatically managed OpenNext; static export would break assessments. No plugin pin or SPA rewrite.                                                                                                                                             |
| Repository      | NetFault has its own manifest/lockfile inside a parent project with different Netlify settings. Child `netlify.toml` makes its settings explicit; select the correct base directory.                                                                                                                            |
| Toolchain       | Node 24 and exact pnpm 11.19.0. Frozen install plus Netlify's documented Next.js pnpm hoisting flag.                                                                                                                                                                                                            |
| Assessment      | Local files and a process queue cannot coordinate serverless invocations. Hosted storage now uses site-scoped Blobs, strong reads and ETag compare-and-swap, with bounded conflict retries. Local files retained for ordinary `pnpm dev/start`.                                                                 |
| Storage errors  | No cloud-to-filesystem fallback. Sanitize errors. Require ETag for successful conditional writes to guard an SDK failure case.                                                                                                                                                                                  |
| PWA             | Fixed cache and navigation overwrites could pair new HTML with missing chunks. Build-stamped worker now installs a complete snapshot; navigation never replaces it. Updates wait for explicit reload or closing all old tabs.                                                                                   |
| API             | Relative paths already correct. All API results, including errors and explicit practice packs, have browser/CDN/Netlify no-store headers. JSON type/size/input validation, same-origin browser write check. No public administration/list endpoint.                                                             |
| Security        | Private scenario remains server-only. Server grades stored observations, deadlines and final results. UUIDs are bearer capabilities. Practice answers are intentionally downloadable, so this remains personal self-assessment, not proctoring. Local journal edits cannot revise authoritative server results. |
| Secrets/logging | No application secrets, personal access tokens or answer logging required. Automatic Blobs runtime credentials stay server-side. Optional storage namespace is configuration, not a secret.                                                                                                                     |
| Dependencies    | Only runtime addition is `@netlify/blobs`. No deployment plugin, auth service, database account or paid plan provisioned. Existing React Flow/Zod/testing dependencies retained.                                                                                                                                |
| Networking      | Simulated RFC1918 addresses are educational data, not deployment endpoints; retained. Localhost appears only in local tooling/docs. Network engine unchanged.                                                                                                                                                   |
| Local emulator  | SDK 11.1 emulator persists data but omits GET ETags. Regression verifies fail-closed behavior. Do not disable concurrency guards to make its assessment updates pass.                                                                                                                                           |

## References consulted

- [Netlify Next.js/OpenNext support](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/)
- [Node, pnpm, lockfiles and hoisting](https://docs.netlify.com/build/configure-builds/manage-dependencies/)
- [Blobs consistency, conditional writes and site-scoped stores](https://docs.netlify.com/build/data-and-storage/netlify-blobs/)
- [Monorepo base and package directories](https://docs.netlify.com/build/configure-builds/monorepos/)
- [Netlify CLI build options](https://cli.netlify.com/commands/build/)
- [SDK conditional-write error issue](https://github.com/netlify/primitives/issues/741)

Official documentation was consulted on 2026-09-19. Installed Next.js route-handler, PWA and build-ID guides were also read. Test evidence is recorded separately; documentation review is not a cloud deployment test.
