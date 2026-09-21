# Roadmap (remaining work not implemented)

Milestone 2E completed the [engine audit](engine-audit.md) and [concrete expansion plan](multi-lab-plan.md), without adding labs or fixing runtime code. Recommended priority: readiness fixes/authoring contracts, then LAB 006 timer mismatch and LAB 007 wrong on-link static next hop together; LAB 008 incorrect mask follows a separate validation/proxy-ARP gate. Revisions/validated variants and non-chain topologies come later. All implementation remains subject to new authorization; this supersedes the ordering of the earlier broad options below.

Milestones 1/1.5 provide OSPF plus Netlify readiness. Milestone 2A adds the incorrect-gateway lab. Milestone 2B adds one access-VLAN mismatch lab, switchport/running-config inspection and bounded ARP state. Milestone 2C adds LAB 004, static routing and return-path investigation with explicit router ping sources. Milestone 2D adds LAB 005, a passive OSPF transit interface, explicit Hello observations and a targeted repair through the existing engine. These remaining options are not promises or current features. Do not begin them without explicit authorization.

1. Validate the exact broken and repaired configurations in CML/GNS3/physical IOS; save captures and identify formatting/model differences.
2. Perform physical iPhone 11 Safari, VoiceOver and trusted-HTTPS installation tests; refine any device-specific issues.
3. Only after that, consider additional scenario families, trunk/MAC-learning commands, more OSPF network types and separate randomized assessment variants. Each needs consistent engine support and behavioral tests first.
4. Consider optional progress import/sync, multi-device accounts and a real authenticated server store. Secure assessment would need separate content, authorization, signed histories and a clearly defined threat model. Offline answer secrecy cannot be guaranteed.

No LAB 006, FlagForge, general switch emulator, authentication system or LLM grading is included. No deployment is authorized as part of 2D.
