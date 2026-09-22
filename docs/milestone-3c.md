# Milestone 3C — execution plan and verification

Starting from clean `639b36c`. Scope is the existing Academy only: no lab, networking-engine, assessment, Netlify, dependency, route or worker changes.

1. Inspect the 3B implementation and establish fresh lint/type/unit baseline.
2. Preserve published revision-1 content intact. Publish revision 2 of the same three lessons and six exercises, keeping old progress/drafts readable and separate.
3. Add five local HTML/CSS teaching diagrams: one integrated octet/bit visual, mask AND and host-range visuals, delivery-choice and ARP handoff visuals. Break prose into short paragraphs without removing wording or essential details.
4. Convert all six exercises to a shared tap-card stepper with answer review and keyboard-accessible radio groups. Keep subnet calculations substantive through plausible boundary distractors plus host-bit reasoning. No dragging or mobile keyboard required.
5. Make detailed solutions explicitly requested for new revisions; return non-spoiling retry guidance and suppress duplicate submissions/reveals.
6. Verify revision preservation, all exercises, rapid taps, accessibility, 414px/360px, offline use and all seven lab regressions. Document actual commands/results and physical-iPhone checklist.

The historical Field Guide bodies, public LAB 002 link and assessment guard remain unchanged. No commit, push or deployment is authorized.

## Teaching diagrams and reading rhythm

| Lesson | Visual | Purpose |
| --- | --- | --- |
| Understanding IPv4 Addresses | Four numbered octet cards showing decimal, binary and 8-bit width, joined by the 32-bit equation | One integrated visual communicates both address structure and bit count, avoiding two redundant diagrams. Cards wrap to a clearly numbered 2×2 grid on phones. |
| Subnets | Bit-by-bit /26 AND on 192.168.10.70 with N/H labels and full mask | Shows why two final-octet bits are retained and six cleared; labels and text complement color. |
| Subnets | Ordered network/usable/broadcast range for 192.168.10.64/26 | Separates .64, .65–.126 and .127, distinguishes address roles and states 62 usable hosts and /31-/32 scope. |
| Gateways/ARP | Local-versus-remote branches from 192.168.10.10/24 | Contrasts final destination IP with immediate frame receiver: local peer versus gateway. |
| Gateways/ARP | Three numbered request/reply/data handoffs | Shows a local ARP broadcast, gateway reply, and frame to the gateway while the IP packet still targets 192.168.20.10. |

All diagrams are locally bundled semantic HTML/CSS with captions and equivalent readable labels, without external images/fonts, animation or libraries. They depict conceptual examples, not added simulator capabilities. The original teaching text is split into short paragraphs with whitespace-only changes; its caveats and worked calculations remain. No essential explanation is hidden behind a new disclosure control. The application currently supports its existing dark theme only.

## Six-exercise audit and interaction decisions

| Stable exercise ID | Before (revision 1) | After (revision 2) / reasoning preserved |
| --- | --- | --- |
| `valid-format` | Three validity dropdowns | Three classification steps using large Valid/Invalid cards; still checks both octet range and group count. |
| `read-octets` | Four number inputs + boundary dropdown | Select octets in their original order from the same reusable value bank, then answer the prefix question. Values are not removed automatically, so choosing one never solves later positions. |
| `guided-subnet` | Four typed IPv4 boundaries | Determine host-bit count, then choose each boundary from plausible wrong blocks, copied-host values and off-by-one reserved endpoints. The nearby diagram uses a different subnet. |
| `independent-subnet` | Four typed /27 boundaries | Independently determine host bits and all four boundaries with /26, wrong-block and reserved-endpoint distractors. No diagram highlights the answer to this problem. |
| `local-remote` | Three dropdowns | Classify each destination with Local/Remote cards, under the same route/mask assumptions. |
| `next-hop` | Typed network/next-hop IPs + two dropdowns | Four decision steps: source subnet, destination classification, ARP next hop and a discriminating observation. Diagnostic alternatives represent plausible incomplete investigations, not jokes. |

Each flow has Previous/Next controls, a full choice review with per-answer Change buttons, deterministic grading and meaningful field-level guidance. Native radio groups support Tab, arrows and Space, with visible focus. No dragging or typing is necessary. Selection alone earns no credit. Detailed solutions require explicit requests, including after wrong or correct submissions; requests remain separately recorded. The ordinary unaided/after-help distinction remains conservative after any feedback.

## Compatibility and persistence

`content-v1.ts` is an unchanged copy of the published registry, checked by a newline-normalized source fingerprint and the existing 54 legacy Academy tests. Current module, three lessons and six exercises move to revision 2 with stable IDs. New schema fields are additive; old content remains valid. The persistence schema/key stays `netfault.academy.progress.v1`. Old records are not migrated, erased, regraded or credited toward revision 2. The update banner explains the fresh attempt; expandable history resolves original exercise prompts and labels and shows old drafts/submissions/reveals.

Repeated identical checked selections are deduplicated for tap exercises, including after reload. Changed answer sets create real retry records. Reveals remain idempotent, completed timestamps are not duplicated, and no troubleshooting keys are used. Storage corruption/quota recovery and exports remain intact. As before, use one active learning tab: localStorage is not a cross-tab transactional database.

## Changed files / dependencies

Academy `content.ts`, `schema.ts`, `progress.ts`, `academy.tsx`, `exercise.tsx`, and `academy.css`; new `content-v1.ts`, `diagram.tsx`, and `history.tsx`. `netfault.tsx` changes only the displayed milestone label. Updated legacy Academy tests to explicitly exercise revision 1; new `academy-touch.test.ts`, `academy-touch.spec.ts` and browser helpers; updated current Academy browser flows and added an Academy-only 360px project in `playwright.config.ts`. Updated README, AGENTS, Academy documentation, architecture, iPhone checklist and verification pointers. No new dependency, route, network command, service-worker change or deployment configuration.

Answer cards use `touch-action: manipulation`, allowing panning and pinch-zoom without introducing a drag interaction. Native Safari zoom, VoiceOver and physical one-handed comfort still require the manual acceptance pass below.

Complete file inventory (paths relative to this repository):

```text
AGENTS.md
README.md
docs/architecture.md
docs/iphone-testing.md
docs/learning-academy.md
docs/milestone-3c.md (new)
docs/verification.md
playwright.config.ts
src/components/academy/academy.tsx
src/components/academy/diagram.tsx (new)
src/components/academy/exercise.tsx
src/components/academy/history.tsx (new)
src/components/netfault.tsx (display label only)
src/lib/academy/content-v1.ts (new immutable archive)
src/lib/academy/content.ts
src/lib/academy/progress.ts
src/lib/academy/schema.ts
src/styles/academy.css
tests/academy.test.ts
tests/academy-touch.test.ts (new)
tests/browser/academy-helpers.ts (new)
tests/browser/academy-touch.spec.ts (new)
tests/browser/academy.spec.ts
```

## Verification — 22 September 2026

The clean starting revision passed fresh lint, strict TypeScript and 320 unit tests; the reported 3B results were not used as a substitute. After implementation, the following checks were executed locally on Windows:

| Exact command | Result |
| --- | --- |
| `pnpm lint` | Passed, including the final source changes |
| `pnpm typecheck` | Passed, strict TypeScript |
| `pnpm test` | 335 passed in 15 files; no failures or skips |
| `pnpm build` | Passed; final build `6zHCfrGoVc_502D6JItAb`, generated offline worker, `/api/lab` remains dynamic |
| `$env:CI='true'; $env:PW_PRODUCTION='1'; pnpm test:browser` | 92 passed, no failures or skips (5.6 minutes), build `_jISvabEdAb91ufnS9TdS` |
| `$env:CI='true'; $env:PW_PRODUCTION='1'; pnpm test:browser academy deployment privacy` | 36 passed, no failures or skips (1.9 minutes), final build `6zHCfrGoVc_502D6JItAb` |
| `git diff --check` | Passed |

The full browser run covers 1440×1000 desktop and 414×896 touch emulation across all seven labs, plus an Academy-only 360×800 touch project. It verifies command/evidence/diagnosis/repair/journal workflows, server-backed assessments and privacy boundaries, production offline packs, Academy guards, corrupt-data recovery, all six tap exercises, keyboard focus, retry/reveal behavior and original-revision drafts. Five diagram screenshots were generated per viewport; narrow-screen diagrams and representative desktop/414px views were visually inspected.

An initial targeted browser run exposed two test-selector timeouts: a submit locator retained the old accessible name after submission, and a focus check incorrectly nested a root-relative locator. Both selectors were corrected without weakening their assertions. All those cases passed in the full suite. The final source then received only the `touch-action: manipulation` adjustment and the displayed 3C label; all 36 relevant final-build checks passed, including an explicit gesture-policy assertion. No remaining failures or skipped production checks.

Source comparisons with `HEAD` also confirmed that scenario/server modules, networking engine, lab grader/schema/storage/catalog, original Field Guides, API routes, worker source/generator, package/lockfile and deployment configuration are unchanged. This is local verification, not a live Netlify deployment, physical iPhone, Safari/VoiceOver or controlled-router-lab certification. Browser test sessions and generated caches/reports are ignored local artifacts.

## Open and manually accept

From PowerShell in the repository:

```powershell
pnpm build
pnpm start
```

Stop any existing server on this project's port before starting another. Open <http://localhost:3100>, then **Learn networking → Explore module → Open lesson 1**. Continue through all three lessons. If the production worker offers **Reload to update**, finish any active assessment before accepting it. Existing progress stays on the same browser/origin; do not clear site data to upgrade.

For online iPhone testing on the same Wi-Fi, keep this server running and open `http://YOUR-LAPTOP-IP:3100` in Safari. Offline/Home Screen acceptance requires trusted HTTPS; LAN HTTP does not meet that requirement. No HTTPS service, public deployment or account connection was created here. See [Windows/iPhone setup](../README.md) and the [short physical iPhone checklist](iphone-testing.md#milestone-3c-short-physical-iphone-acceptance-not-performed).

Physical checks cover all five diagrams, one-handed completion of all six exercises, scrolling from an answer card, retry without an automatic solution, repeated taps, partial-draft resume, revision history, VoiceOver/keyboard focus, increased text size and airplane-mode use after **Available offline · Academy**. External references and timed assessments require internet. Public Academy answers remain inspectable; this is learning practice rather than a protected examination.
