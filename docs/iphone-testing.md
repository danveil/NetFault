# iPhone, HTTPS and manual QA

Target: iPhone 11, 414 × 896 CSS pixels, portrait. Automated Chromium viewport emulation does not demonstrate native Safari or physical touch behavior. Physical device testing has not been performed.

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
