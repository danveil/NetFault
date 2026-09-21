# iPhone, HTTPS and manual QA

Target: iPhone 11, 414 × 896 CSS pixels, portrait. Automated Chromium viewport emulation does not demonstrate native Safari or physical touch behavior. Physical device testing has not been performed.

## Milestone 3B Academy manual acceptance (not physically performed)

- [ ] On localhost for desktop, or an authorized trusted HTTPS release for iPhone, open Learn networking and the IPv4 module. Check all three lessons and four Field Guides in portrait/landscape, Safari and Home Screen mode.
- [ ] Read the seven-part progression, type numeric/IP answers with the iOS keyboard, submit wrong then correct answers, request an independent solution and inspect its reveal record. Ensure long command examples scroll within their panel.
- [ ] Use VoiceOver and keyboard navigation where available: headings receive focus after navigation, form labels are announced, focus rings are visible, controls are comfortable to tap and no page-width overflow occurs.
- [ ] Mark a lesson read, refresh, Continue lesson and check draft values, submissions and requested reveals. Verify “read” and “completed exercise” are distinct; exports retain old revision records.
- [ ] Follow the gateway lesson's LAB 002 link. Confirm mode selection appears without a new attempt; investigate manually, save evidence/notes, visit Academy and return with those values preserved.
- [ ] Start a timed assessment, try Learn networking/Field Guide and confirm access is blocked. Refresh and verify deadline/history remain; an outage must not pause the timer.
- [ ] Wait for **Available offline · Academy** after production installation/reload. Enable airplane mode, reload, read all three lessons, complete exercises, refresh and resume their progress. Revisit previously downloaded practice packs. External references and assessments require reconnection.
- [ ] Reconnect, accept a later authorized deployment update, and verify Academy and lab records survive. If storage is unavailable/full/corrupt, confirm visible recovery messages and raw/session exports without silent deletion.
- [ ] No physical iPhone or live Netlify acceptance is claimed by the automated Chromium tests. Local LAN HTTP cannot validate iPhone service-worker installation; use trusted HTTPS for that check.

## Milestone 3A manual acceptance (not physically performed)

- [ ] After a separately authorized HTTPS deployment, accept Reload to update; all seven lab cards remain available and old journal entries still open.
- [ ] Play LAB 006 and LAB 007 in Safari and Home Screen standalone mode. Tap diagram nodes/device alternatives, pan/zoom, test VoiceOver/focus and portrait/landscape.
- [ ] Use the numeric Hello/Dead fields in LAB 006 and prefix/observed/proposed next-hop fields in LAB 007. Confirm the keyboard does not hide controls or produce page-width overflow. Scroll long terminal output inside its panel.
- [ ] Collect diagnostic evidence, use progressive practice hints, submit, read seven teaching parts and reveal the independent solution only after attempting it. Verify actual before/after outputs and both host directions.
- [ ] Refresh and reopen each saved diagnosis and source-aware command history. Inspect both new and existing lab entries.
- [ ] Start each required practice pack online and reload after worker installation. Enable airplane mode, reopen cached labs, complete both new labs and their repaired previews, then reconnect.
- [ ] Complete assessments online; ensure hints/guide access stay unavailable during attempts and deadlines continue through refresh/outage. Offline assessment must not be advertised.
- [ ] For eventual Netlify acceptance, turn the laptop off and verify public HTTPS use; no such deployment/device test was performed in this milestone.
## LAB 005 manual acceptance (not yet performed on physical iPhone)

- [ ] On the authorized HTTPS release, accept Reload to update and select The Silent OSPF Interface. Confirm the five lab cards fit and LAB 001–004 remain available.
- [ ] Inspect both PCs and all three routers through diagram nodes and device buttons; pan/zoom and verify VoiceOver labels/focus.
- [ ] Compare local/remote PC pings, all router neighbor tables, interface brief, OSPF interface, protocols and running configuration. Scroll terminal output without moving the whole page sideways.
- [ ] On R2 ping 10.0.23.2 with blank source (success), then Gi0/0 (failure). Confirm destination/source fields remain usable above the iOS keyboard.
- [ ] Select explicit passive-setting, physical-up, neighbor and routing evidence. Use four progressive hints in practice; check the diagnosis's router/interface/fix/reason controls.
- [ ] Submit and review the seven-part feedback, independently answer the Cedar/Birch exercise before revealing its solution, then run the repaired preview. Confirm R2–R3 FULL/-, remote LAN routes, both host pings and preserved LAN passive settings.
- [ ] Reload and reopen the journal; check score, diagnosis, evidence, notes, source history and hints.
- [ ] Start all five practice labs online and reload once after the worker is ready. Close/reopen in airplane mode, revisit each cached lab, then complete LAB 005 and save its preview/feedback. Restore connectivity afterward.
- [ ] Complete timed assessment online; refresh while investigating, confirm time continues and hints remain unavailable. Disconnecting must not offer offline assessment or pause its deadline.
- [ ] Repeat in Safari and the installed Home Screen app; verify old saved progress survives an authorized deployment update. This checklist has not been physically executed by Codex.

## LAB 004 manual acceptance (not yet performed on physical iPhone)

- [ ] Select The Missing Return Path; inspect PC-A, SW1, R1, R2 and PC-B using diagram and device buttons.
- [ ] Compare PC-A local gateway ping with remote ping, and read both routing tables with horizontal terminal scrolling.
- [ ] On R1, leave Ping source blank for success to PC-B, then enter Gi0/0 or 192.168.10.1 for failure. Confirm the iOS keyboard/input does not obscure commands and source appears in history.
- [ ] Capture PC-A addressing plus both routing tables, use all four hints if desired, and complete the destination prefix/next hop/reason form without clipping.
- [ ] Submit, read the seven-part lesson, explicitly reveal the independent solution, then verify the repaired network and both packet directions.
- [ ] Reload, reopen the journal and confirm diagnosis, notes, source probes, evidence and hint count persist.
- [ ] Cache each of the four packs over trusted production HTTPS, reload online after installation, enable airplane mode and reopen every saved practice lab. Complete LAB 004 and its preview offline.
- [ ] Reconnect and complete a timed assessment; hints remain absent and refreshing retains server-owned observations. Do not expect assessment to work offline.
- [ ] After a separately authorized future deployment, verify the installed app update and laptop-off hosting independence. No live release was made during 2C.

## Connection and PWA preparation

For Netlify, follow [the deployment checklist](NETLIFY_DEPLOYMENT.md): use the public HTTPS URL and turn the Windows laptop off to prove hosting independence. The LAN steps below remain an optional local-development path. Test installed-app updates and offline practice on the physical device after deployment; these have not been physically verified.

- [ ] Start NetFault on Windows and open localhost:3100 first.
- [ ] Identify the active Windows LAN IPv4 address with `ipconfig`.
- [ ] Put both devices on the same trusted network; disable guest isolation if your router intentionally separates clients.
- [ ] Open `http://LAPTOP-IP:3100` in iPhone Safari. Allow Node through Windows Firewall on the private network if prompted; never disable the firewall globally.
- [ ] Verify that HTTP LAN mode runs online, and do not label it offline-ready.
- [ ] For installation/offline tests, run a production build behind HTTPS using a certificate trusted by iOS. Certificate SAN must match the URL. Keep the proxy's Host header unchanged.
- [ ] If using your own local CA, install its public certificate/profile on your own device, then explicitly trust it under Settings → General → About → Certificate Trust Settings (wording may vary by iOS). Keep the CA private key private. Remove the profile when no longer needed.
- [ ] Open the trusted HTTPS URL, start Practice, wait for service worker installation, and reload once online.
- [ ] Use Safari Share → Add to Home Screen. Reopen and confirm standalone display, icon and safe-area spacing.

## Complete playthrough

- [ ] Read incident/design brief without clipping at 414px; rotate to landscape and back.
- [ ] Tap all five topology devices; pan, pinch zoom, zoom buttons and fit view work. Use the device-button alternative and confirm the inspector changes.
- [ ] Scroll the page while outside the diagram. Terminal horizontal scrolling must not make the whole page wider.
- [ ] Run PC `ipconfig`, ping gateway and remote PC, then tracert.
- [ ] Inspect R1/R2/R3 interfaces, neighbors, routes, protocol state and running configurations.
- [ ] Enter an invalid destination and receive a helpful validation output. No keyboard zoom on inputs; labels remain visible.
- [ ] Select R2/R3 configuration observations, one neighbor table and one routing table as evidence. Toggle selection from the notebook.
- [ ] Submit area mismatch, R2+R3, and R3 Gi0/0 area 0. Receive 100/100 only with the four evidence requirements fulfilled.
- [ ] Open the worked solution and repaired preview. Confirm both end-to-end pings succeed.
- [ ] Reload, reopen the journal entry, inspect every recorded output, selected evidence, notes, hints and score. Export JSON.
- [ ] Retry Practice; observations and evidence begin empty. Show all three hints and verify no fourth hint. Reveal solution and verify its assisted flag in the journal.

## Lab 002 — gateway regression

- [ ] Select **Beyond the local network**. Inspect PC-A, SW1, R1, R2 and PC-B using both topology and device controls.
- [ ] Compare PC-A's local and remote ping, `tracert`, `ipconfig /all` and `route print`. Read both switch command outputs without page-width overflow.
- [ ] In the diagnosis form, all five device choices wrap within the viewport. The gateway input does not zoom the page, the explanation selector is usable, and Submit remains reachable with the keyboard dismissed.
- [ ] Select evidence, submit a diagnosis, read all seven teaching sections, verify the repaired trace and reopen the result from the journal.
- [ ] Start and resume a gateway assessment, then submit before its server deadline. Check that reopening the original OSPF lab uses its own topology, commands and grading.
- [ ] Start each lab's Practice Mode online. After the production worker is ready, reload online once, disconnect, and reopen both saved labs. Verify that the two practice packs and their evidence remain separate.

## Offline and assessment

For LAB 003, additionally check:

- [ ] Open **The Wrong Network**. Read the design brief and both FastEthernet port labels; inspect all five devices.
- [ ] Run `arp -a` before and after a failed gateway ping. Confirm no resolved gateway MAC appears before repair.
- [ ] Read both switchport views, VLAN/status tables and running configuration. Long command buttons and terminal scrolling must stay within the viewport.
- [ ] Submit device, interface, observed/intended VLANs and repair with evidence. Check every select control with touch and VoiceOver.
- [ ] Read parts 1–6, think through the independent exercise, then explicitly open part 7. The solution must not display automatically.
- [ ] Verify corrected membership, fresh ARP learning, local/remote pings and unchanged router routes in the repaired preview.
- [ ] Cache all three practice labs online, reload, disconnect and reopen each journal entry. Complete LAB 003 offline and verify old OSPF/gateway progress remains intact.

- [ ] With a production shell and practice pack cached, disable Wi-Fi/cellular, reopen/reload, investigate, grade and reopen the journal.
- [ ] Restore connectivity. Start Assessment; no hints/reveal, guide or journal access while active.
- [ ] Run commands and submit before the deadline. Reload the attempt and verify no second submission changes the result.
- [ ] Start a new assessment; background the app or lock the phone. Time must continue.
- [ ] Disconnect during assessment. Commands should report connection failure and preserve existing evidence. Reconnect before the deadline and continue.
- [ ] Let the deadline expire without submitting. Reconnect if needed: the attempt ends with zero and final feedback; changing the client clock cannot extend the server deadline.

## Accessibility and persistence

- [ ] With VoiceOver, read labels, select a device, run a command, navigate notebook controls and complete the diagnosis.
- [ ] Test larger text, 200% browser zoom on desktop, reduced motion and a hardware keyboard. Verify focus visibility and no clipped actions.
- [ ] Test Safari normal/private browsing and low storage. Storage failure must be visible; export is the recovery path.
- [ ] Remember HTTP and HTTPS are different storage origins. Export before switching; automatic import/sync is not implemented.

References: [MDN service workers and secure contexts](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers), [MDN PWA secure connection](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Tutorials/CycleTracker/Secure_connection). HTTPS with a trusted certificate is required over a LAN; localhost is a development-only exception on the device accessing it.
