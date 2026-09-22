import { normalizeIPv4 } from "./grading";

// Authored /24, /30 and exact-address examples only. This is not an IOS parser.
export function matchesAuthoredWildcard(address: string, selector: string, wildcard: string): boolean {
  if (!normalizeIPv4(address) || !normalizeIPv4(selector)) throw Error("Invalid IPv4 example");
  if (!["0.0.0.0", "0.0.0.3", "0.0.0.255"].includes(wildcard)) throw Error("Unsupported authored wildcard");
  const a = address.split(".").map(Number),
    s = selector.split(".").map(Number),
    w = wildcard.split(".").map(Number);
  return a.every((octet, index) => (octet & (255 ^ w[index])) === (s[index] & (255 ^ w[index])));
}
