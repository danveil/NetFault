# Deploy NetFault to Netlify

Milestone 3B adds a public Academy module to the existing cached root shell. No new hosting settings, environment variables, dependencies, API routes or Blobs storage changes are required. On a separately authorized deployment, accept the normal update/reload and check **Available offline · Academy** before disconnecting. Academy progress uses a separate browser key; older releases will ignore it. Export both Academy progress and the lab journal before rollback. All seven labs and their published revisions are preserved. This milestone performs no deployment or live Netlify/physical iPhone test. See [Academy architecture](learning-academy.md) and [3B verification](milestone-3b-plan.md).

Milestone 2D adds LAB 005 without changing Netlify configuration, dependencies, environment variables, API handlers, Blobs storage or worker strategy. No account connection, commit, push, remote project change or deployment was performed. After a separately authorized release, accept the app's update and start LAB 005 online to cache its practice pack. All five packs and existing journals remain readable by the new version. Older releases cannot parse `passive-01` attempts: export journals before rollback across this boundary. See [LAB 005](passive-interface-lab.md) and [current verification](verification.md). No new manual hosting configuration is required for this lab; actual live Netlify and physical iPhone acceptance remain separate checks.

Milestone 2C adds LAB 004 without changing Netlify configuration, dependencies, environment variables, Blobs storage or worker strategy. Work was local only; no remote project, account, commit, push or deployment was changed. After a separately authorized release, load the updated app and start LAB 004 online to cache its own practice pack. New code preserves all earlier packs/journals; older releases cannot read `return-01` attempts, so export journals before rollback across this boundary. See [LAB 004](return-path-lab.md) and [current verification](verification.md). Live Netlify and physical iPhone checks remain separate release acceptance tasks.

Milestone 2B adds LAB 003 without changing build settings, dependencies, Blobs storage or worker strategy. The user reports an existing deployment; the new version has not been deployed or tested live by this milestone. Use the existing update flow to receive the third lab after a separately authorized release. New code preserves v1/v2 packs and journals; older code cannot parse `vlan-01` attempts. Export before rolling back across this content boundary. See [VLAN model](vlan-lab.md) and [current verification](verification.md).

Milestone 2A retains these build/runtime/storage settings and adds one gateway lab. Old OSPF data stays readable by the new release; older releases cannot parse new gateway attempts. Export journals before considering a rollback across that content boundary. No live site is changed by the 2A implementation.

Milestone 1.5 prepares the existing application for hosting. A Netlify-hosted HTTPS site runs independently of your Windows laptop. No account has been connected and no deployment was made during this work. See [the audit](deployment-audit.md) and [verification](verification.md) for actual evidence and remaining checks.

## Repository and project settings

Use Git-based deployment with the supported, automatically managed **OpenNext adapter**. Do not upload `public/` as a static site, enable `output: 'export'`, add a catch-all SPA redirect, or pin/install a Next.js deployment plugin.

This workspace has a parent application with its own Netlify configuration. Either publish the contents of `netfault/` as a dedicated repository, or import the existing parent repository with **Base directory = `netfault`**. In the latter case, confirm that Netlify resolves **`netfault/netlify.toml`**, not the parent file. NetFault's own lockfile and package manifest must be in the selected base. A dedicated repository avoids publishing unrelated projects, but creating it is a separate user action.

| Setting                      | Value                                                                                                |
| ---------------------------- | ---------------------------------------------------------------------------------------------------- |
| Base directory               | `netfault` for the existing parent repository; blank for a dedicated NetFault repository             |
| Package directory            | Leave unset unless the Netlify monorepo UI requires it; if required, select the same NetFault folder |
| Build command                | `pnpm build`                                                                                         |
| Publish directory            | `.next`, relative to base; runtime packaging is adapter-managed                                      |
| Node                         | `24`, recorded in `.node-version`, engines and child `netlify.toml`                                  |
| Package manager              | `pnpm@11.19.0`, selected by `packageManager`; commit `pnpm-lock.yaml`                                |
| Dependency install           | Netlify detects the pnpm lockfile; `PNPM_FLAGS=--frozen-lockfile --shamefully-hoist`                 |
| Required application secrets | None                                                                                                 |

Hoisting follows Netlify's documented Next.js/pnpm guidance so the adapter can resolve traced dependencies. `pnpm-workspace.yaml` also persists the equivalent public hoist pattern and uses a project-local virtual dependency layout so pnpm 11 does not try to change layouts when running scripts. The frozen lockfile prevents deployment from silently selecting a different dependency graph. Do not set `NODE_ENV=production` for dependency installation: build tools are development dependencies. Do not add localhost/API-base environment variables; application requests use `/api/lab`.

The build command runs Next and then generates `public/sw.js` using `.next/BUILD_ID`. That generated file is ignored; `scripts/service-worker.js` and `scripts/build-sw.mjs` are the source. Always use `pnpm build`, not a standalone `next build`, when producing deployable output.

## Assessments and storage

On Netlify, the Node route handler uses **Netlify Blobs**, in the site-scoped store `netfault-assessments-v1`. Runtime credentials are supplied automatically by the adapter/platform. Do not create a personal access token or put credentials in `NEXT_PUBLIC_*` variables. Missing cloud context fails with an unavailable response; it never falls back to temporary function files.

Each attempt is one validated version-1 record. Strong reads plus conditional ETag writes serialize competing commands/submissions across invocations; conflicts re-read state before retrying. Final grades and expiry are authoritative on the server. Eight unresolved conflicts produce a retryable 409 instead of a lost update. An ambiguous network failure may have committed a command before its response was lost: resume first to check history. Repeated final submissions return the already-finalized result. There is no claim of exactly-once HTTP command delivery.

Blobs survives function restarts and code deployments. It is available on Netlify plans without provisioning a separate paid database, but requests/storage/functions/builds use your plan's allowances or credits. Review your account's current [pricing and usage limits](https://www.netlify.com/pricing/), set usage notifications, and monitor them. This project does not enable billing upgrades. The public start endpoint has no account-based quota: for unexpected abuse, restrict site access using available Netlify controls or take the site offline. Do not use this personal application as a high-stakes exam service.

UUID attempt IDs are bearer capabilities. Anyone holding one can access that attempt. No listing/admin endpoints are exposed. Do not share IDs or put private data into notes. Records are not automatically deleted in this milestone; review retention periodically using the Netlify Blobs UI. Deleting a record prevents server resume; browser journal exports remain separate. No migrations or automatic data deletion are performed.

Optional **`NETFAULT_STORAGE_NAMESPACE`** (server/functions scope, lowercase letters/digits/hyphens, up to 80 characters) selects a different site-scoped store. Keep production's value stable. Before enabling Deploy Previews or branch deploys, set a different value for those contexts, e.g. `netfault-assessments-preview-v1`, to separate preview writes from production. Different deploys of one site otherwise share the default store. A changed namespace does not migrate old sessions.

Ordinary local `pnpm dev` / `pnpm start` keeps the existing `.netfault/sessions` file backend, suitable for one process. Local sessions are not automatically uploaded. Browser progress is origin-specific and does not automatically move from localhost to the Netlify URL; export your journal first. There is no cross-device sync or journal import in this milestone.

## Deployment steps (performed by you)

1. Review the changes and test results. Commit/push the desired NetFault source, manifest, lockfile and child config to your chosen Git repository. Do not include `.env*`, `.netfault/`, `.netlify/`, caches or `node_modules`.
2. In Netlify, add a project by importing that Git repository. Set the base, build and publish settings above. This is a new project unless you deliberately choose otherwise; do not overwrite the parent portfolio's site.
3. Check environment/context settings. No secrets are required. Separate preview storage if previews are enabled.
4. Start the build. Inspect logs for the correct base, Node 24, pnpm 11.19.0, frozen install, `pnpm build`, generated offline worker, and automatically managed Next.js/OpenNext runtime. Confirm a server function is packaged for the route handler.
5. Open the resulting `https://…netlify.app` URL. Complete practice and assessment, reload and resume an assessment, and inspect function logs if it fails. Verify API responses are not CDN-cached and the Blobs store contains the new attempt. These are required first-deployment checks; local tests do not prove cloud behavior.
6. Run the iPhone checks below. A custom domain is optional; the Netlify subdomain already has HTTPS. Your laptop can then be turned off.

## HTTPS, offline use and updates

Use the public HTTPS URL in Safari. Installability/offline service workers require a secure context; LAN HTTP is not equivalent. Icons include 192/512 PNGs, a maskable icon and an Apple touch icon. The manifest uses root scope/start URL and standalone display.

Online first: open the app, start Practice to download its scenario, wait for the shell worker to finish, and reload once online. Then practice commands, evidence, hints, grading, repaired preview and the local journal work offline. Assessment start/resume/commands/submission/finalization all require internet. Its timer continues through outages. An already-saved result can be read locally, but local progress is editable and is not independent proof of a server grade.

The worker never caches APIs or RSC requests. Each build installs its HTML and assets together. A failed installation leaves the previous worker available. A waiting update shows **Reload to update**; progress is saved on each change and reload is disabled while an action is in flight. The assessment timer continues during reload. Closing every tab/installed window also lets a waiting update activate. The current and previous cache generations are retained for old open tabs; close very old tabs after multiple deployments. Browser storage eviction can remove offline data; export important progress. Clearing site data destroys local progress and should be a last resort.

## iPhone 11 acceptance checklist

- Update iOS/Safari (Next.js requires Safari 16.4+). Open the HTTPS URL in Safari with the laptop powered off.
- Check portrait 414 CSS-pixel layout, landscape, topology pan/zoom, touch device selection, readable/scrolled output, keyboard dismissal and destination inputs.
- Complete the ten-step workflow: open lab, inspect PC/router, commands, evidence, diagnosis, feedback, repaired preview, journal reload, timed assessment, cached offline practice.
- From Safari Share, Add to Home Screen. Open the installed app; verify name/icon/safe areas and retained progress. Safari and installed-app storage behavior must be checked on the actual device.
- After online practice and one reload, enable Airplane Mode and disable Wi-Fi. Close/reopen and reload; run commands, grade, preview repair and reopen the journal. Confirm assessment cannot proceed offline.
- Reconnect and finish a new assessment; close/reopen midway to check its authoritative deadline/history. Repeat one submission; final feedback must not change.
- On a later deployment, foreground the installed app; accept the update, verify progress remains, then repeat offline reload. Check VoiceOver labels and text zoom.

No physical iPhone or native Safari test is claimed by the automated Chromium viewport suite.

## Troubleshooting

| Symptom                        | Check                                                                                                                                                                  |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Wrong app or wrong build       | Base/config path selected the parent project. Inspect resolved build settings.                                                                                         |
| Frozen lockfile failure        | Run the intended pnpm version locally; update/commit a valid lockfile for intended dependency changes, not an unlocked deployment install.                             |
| Adapter cannot resolve imports | Confirm hoisting flag, Node version and fresh dependency cache. Use Netlify's clear-cache-and-retry build once after correcting settings.                              |
| API 404/static site            | Do not use static export or `public` as publish directory. Confirm automatic OpenNext/function generation and no SPA rewrite.                                          |
| Assessment 503                 | Check function logs/Blobs availability and runtime context. Do not add a filesystem fallback or expose a token. Confirm namespace validity. Missing ETags fail closed. |
| Assessment 409                 | Another tab is updating the attempt; close duplicate tabs, resume, then retry.                                                                                         |
| Origin 403                     | Use one canonical HTTPS origin and preserve Host through any extra proxy. Do not disable origin checks globally.                                                       |
| Old app/offline fails          | Go online, foreground/reload, accept update or close all app windows. First download Practice. Export before considering site-data reset.                              |
| Missing old journal            | Different origin/browser/device or storage eviction. Localhost data is not automatically transferred to HTTPS.                                                         |

Optional local build probe: `netlify build --offline` from this directory, using a current CLI. It must not ask you to connect/link for this audit. Local tooling is not a deployed CDN/functions validation. SDK 11.1's local Blobs emulator omits ETags on GET, so authoritative update operations intentionally fail closed there; ordinary local app tests use the file backend. Never remove that guard to accommodate the emulator.

On the audited Windows machine, the offline build selected the correct config and automatic Runtime 5.16.0, completed `pnpm build`, then failed when the adapter attempted to create a function-bundle symlink (`EPERM`). This is an unpassed packaging check, not a successful deployment. No Windows security setting was changed to bypass it. Netlify's hosted build still needs verification; inspect its logs and run the first-deployment smoke checks above.

## Rollback

In Netlify's deploy history, publish a previously known-good **compatible** deploy, then verify the HTTPS page/API and reload installed clients. Blobs is site-scoped: code rollback does not roll back data. Keep the same namespace/schema for compatible Milestone 1.5 releases; do not roll back to the pre-hosting filesystem implementation expecting existing hosted sessions to work. Export local journals before invasive recovery. Do not delete stores or clear site data as a routine rollback step. Worker registration checks the restored script and offers an update; close old tabs if needed.

References: [Next.js runtime](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/), [dependency settings](https://docs.netlify.com/build/configure-builds/manage-dependencies/), [Blobs](https://docs.netlify.com/build/data-and-storage/netlify-blobs/), [monorepos](https://docs.netlify.com/build/configure-builds/monorepos/). Recheck these if Netlify's UI/runtime changes.
