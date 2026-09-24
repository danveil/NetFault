import { dotted, mask, sameSubnet, type StandardAcl, type Device } from "./schema";

// Entries are validated in configured sequence order. Evaluation never normalizes the policy.
export function evaluateAcl(acl: StandardAcl, source: string) {
  const entry = acl.entries.find((e) => e.source === "any" || sameSubnet(source, e.source.network, e.source.prefix));
  return { permitted: entry?.action === "permit", entryId: entry?.id, sequence: entry?.sequence, implicit: !entry };
}
export function aclSource(source: StandardAcl["entries"][number]["source"], display = false) {
  return source === "any"
    ? "any"
    : `${source.network}${display ? ", wildcard bits" : ""} ${dotted(~mask(source.prefix) >>> 0)}`;
}
export function aclOutput(d: Device) {
  return [
    ...(d.acls?.flatMap((a) => [
      `Standard IP access list ${a.name}`,
      ...a.entries.map((e) => ` ${e.sequence} ${e.action} ${aclSource(e.source, true)}`),
    ]) ?? ["No IP access lists configured."]),
    "(Condensed standard IPv4 ACL ordering; counters and logs are not modeled.)",
  ].join("\n");
}
export function moveAclEntry(d: Device | undefined, name: string, sequence: number, newSequence: number) {
  const acl = d?.acls?.find((a) => a.name === name);
  const entry = acl?.entries.find((e) => e.sequence === sequence);
  if (!entry || !acl) throw Error("Select an existing router, ACL and entry sequence from your observations.");
  if (sequence === newSequence) return;
  if (acl.entries.some((e) => e.sequence === newSequence))
    throw Error("That sequence is already in use. Choose an unused sequence.");
  entry.sequence = newSequence;
  // Only an explicit learner edit changes configured order; predicates/actions remain intact.
  acl.entries.sort((a, b) => a.sequence - b.sequence);
}
