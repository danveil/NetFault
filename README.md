# NetFault

A mobile-first, evidence-based network troubleshooting workspace for a Universiti Malaya student studying WIA2008 Advanced Network Technology. Independent learning aid; not an official UM or Cisco product.

**Milestone 2A:** two complete labs: OSPF area mismatch (“The silent route”) and incorrect default gateway (“Beyond the local network”). No other Milestone 2 scenarios are included. No external AI service, generated gameplay text or real network probing. Local use needs no cloud account; Netlify hosting uses its serverless runtime and Blobs storage.

For a public HTTPS app that works with your laptop turned off, follow [Netlify deployment instructions](docs/NETLIFY_DEPLOYMENT.md). This milestone does not deploy or modify a live site. The existing simulator, journal and deterministic grading are extended for the new lab; the Netlify assessment storage architecture is unchanged.

## Run on Windows

Requirements: Node.js 24 (developed with 24.15), pnpm **11.19.0**, a current browser. Next.js 16 requires Safari 16.4+; update the iPhone's iOS if necessary.

```powershell
cd "C:\Users\afiq hakiki\Documents\ChatGPT\cs projects\netfault"
pnpm install --frozen-lockfile
pnpm dev
```

Open **http://localhost:3100**. Port 3100 avoids the existing projects' usual port. This project has its own package manifest and lockfile; run commands from `netfault`, not the parent portfolio folder.

For production and offline testing:

```powershell
pnpm build
pnpm start
```

The service worker is enabled only in production and a secure context. Stop the dev server before starting production on the same port. To regenerate PNG icons after editing `public/icon.svg`, run `node scripts/icons.mjs`.

If the local shared pnpm store contains corrupt files, use `pnpm install --force --store-dir .pnpm-store --package-import-method copy`. This was necessary on the development machine; ordinary installs should use the frozen lockfile.

## Open from an iPhone on the same network

1. Keep the Windows server running. The scripts bind to `0.0.0.0`.
2. Run `ipconfig` in PowerShell. Find the IPv4 address of the active Wi-Fi/Ethernet adapter, for example `192.168.1.42`.
3. Connect the iPhone to the same trusted network. Open **http://YOUR-LAPTOP-IP:3100** in Safari, e.g. `http://192.168.1.42:3100`.
4. If Windows Firewall prompts for Node.js access, allow it on the private home network. Do not turn the firewall off or open the port to the internet. Guest Wi-Fi/client isolation or some VPNs can prevent devices from reaching each other.

HTTP over the LAN supports online practice and assessment and browser storage. **It is not a secure context:** the iPhone does not receive localhost's special service-worker exception. Offline PWA behavior needs trusted HTTPS. An Add to Home Screen shortcut alone does not demonstrate offline support.

For full PWA use, put the production server behind an HTTPS reverse proxy with a certificate trusted by the iPhone. A development alternative is a locally trusted CA (such as mkcert), a certificate whose SAN includes the laptop's LAN IP/hostname, and an HTTPS proxy to port 3100. Install only your own CA certificate on your own iPhone and enable its trust in iOS certificate settings. Preserve the original `Host` header through the proxy. A browser certificate-warning bypass is not sufficient. See [iPhone checklist](docs/iphone-testing.md). No proxy, firewall change or certificate installation was performed by this project.

## Play the lab

1. Select lab 001 or lab 002, choose Practice or Assessment, then Start investigation.
2. Read the incident and expand the design brief. Tap topology nodes or use the accessible device buttons.
3. Run the listed commands. Enter a numeric destination for ping/trace. Select useful output as evidence; revisit all outputs in the notebook.
4. Submit cause, affected device(s), evidence and repair. OSPF asks for both adjacency endpoints; lab 002 asks for the faulted device, a gateway IPv4 address and a structured explanation of forwarding. Notes are stored, **not interpreted or graded**.
5. Review the rubric, explanation, worked commands and repaired-state preview. Reopen any attempt from Your journal, or export JSON.

Practice is untimed with three progressive hints and a recorded solution reveal. It downloads the lab pack, which enables offline play after the production shell is cached. Assessment lasts 20 minutes, requires the server, and locks hints/guide/journal until it ends. Submit before the deadline: an expired attempt without an on-time final submission receives zero and final feedback. Draft choices are saved locally but do not count as a submitted assessment. Closing the app does not pause time.

## Commands implemented

The original OSPF command set remains below. Lab 002 exposes PC-A `ipconfig`, `/all`, `route print`, `ping`, `tracert`; SW1 `show vlan brief` and `show interfaces status`; routers `show ip interface brief`, `show ip route`, `show running-config`, `ping`; PC-B `ipconfig` and `ping`. Commands are selected per device and lab. See [the gateway lab guide](docs/gateway-lab.md) for addressing, the seven-part lesson, rubric and forwarding limits.

| Device   | Supported commands                                                                                                                                              |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Routers  | `show ip interface brief`, `show ip route`, `show ip ospf neighbor`, `show ip ospf interface`, `show ip protocols`, `show running-config`, `ping`, `traceroute` |
| PCs      | `ipconfig`, `ipconfig /all`, `ping`, `tracert`                                                                                                                  |
| Switches | No switches in the OSPF lab; lab 002 adds the two access-switch commands described above                                                                        |

Commands are bounded, condensed IOS-style/PC-style outputs, not byte-for-byte IOS or Windows emulation. No abbreviations, destination names, command flags, arbitrary IOS configuration or live packet probes. Unsupported commands produce an honest message. The repair is selected structurally; a separate preview derives the repaired network for verification.

## Data, assessment and offline limits

- Journal, draft selections and practice packs live in browser localStorage under `netfault.*.v1`. Each lab has a separate pack key; the original OSPF key and old attempts are retained. Cache each lab online before using it offline. There is no cross-device sync. Different HTTP/HTTPS origins, ports and browsers have separate storage. Export before changing origin or clearing data.
- Up to 100 recent attempts, 100 commands per attempt. Storage failures are surfaced; corrupt data is preserved. Raw recovery export is available.
- Local server assessment sessions are JSON files under ignored `.netfault/sessions/`. On Netlify they use durable site-scoped Blobs with strong reads and conditional writes across invocations. UUIDs act as bearer capabilities. Do not share attempt IDs. Server sessions are not automatically pruned in this milestone. Blobs usage counts against your Netlify plan; no paid service was provisioned.
- The assessment payload has no scenario configuration, hidden fault, hints, grading rules or answer key. The server owns observations, deadline and final grade. API responses are `no-store`; the service worker never caches them.
- **This is not a secure exam system.** Anyone with access to a practice pack, source code, browser tools or local server files can inspect answers or alter local progress. Separate tabs/devices can retrieve practice materials. There is no authentication, proctoring or multi-tenant isolation. Hosted use is personal self-assessment; local LAN use should stay on a trusted network. Assessment is intentionally unavailable offline.
- After the production service worker has installed and practice has been started online, reload once online before relying on offline operation. Build-specific snapshots update through **Reload to update** or closing all old app windows. Browser storage and caches may be evicted, especially on mobile. No push notifications or background sync are included.

## Validation commands

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm test:browser
pnpm build
$env:PW_PRODUCTION = "1"
pnpm test:browser
Remove-Item Env:PW_PRODUCTION
```

Browser tests use installed Microsoft Edge for desktop and iPhone-sized Chromium emulation at **414 × 896 CSS pixels**. The production suite also tests actual service-worker offline reload and grading. It starts/stops a local server when one is not already running; ensure a dev server is not reused for a production test. Browser emulation is not physical iPhone testing. See [verification report](docs/verification.md) for actual results and limitations.

## Project map

| Path                          | Responsibility                                                                  |
| ----------------------------- | ------------------------------------------------------------------------------- |
| `src/lib/schema.ts`           | Zod authored scenario, network invariants, diagnosis, observations and attempts |
| `src/lib/engine.ts`           | Derived neighbors, routes, bidirectional reachability and command rendering     |
| `src/server/scenario.ts`      | Server-only scenario, hidden fault, rubric, hints and worked repair             |
| `src/server/sessions.ts`      | Persisted server assessments, deadlines, serial updates and finalization        |
| `src/app/api/lab/route.ts`    | Validated practice-pack and assessment API                                      |
| `src/components/`             | Responsive workspace, React Flow topology and learner workflow                  |
| `src/lib/storage.ts`          | Versioned local journal and practice pack                                       |
| `src/lib/lessons.ts`          | Seven-part teaching format for the four concept groups                          |
| `scripts/service-worker.js`   | Offline worker source; `pnpm build` generates ignored `public/sw.js`            |
| `src/server/session-store.ts` | Local files / Netlify Blobs storage boundary, conditional hosted updates        |
| `netlify.toml`                | Child build settings, Node 24, frozen pnpm install and hoisting                 |
| `tests/`                      | Unit, browser, API boundary and offline tests                                   |

Read [architecture](docs/architecture.md), [network correctness](docs/network-correctness.md), [scenario authoring](docs/scenario-authoring.md), [roadmap](docs/roadmap.md), and [execution plan](docs/execution-plan.md).
