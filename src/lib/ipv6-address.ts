// WHATWG URL's IPv6 parser is available in the browser and Node. No network request occurs.
// This first subset accepts hexadecimal IPv6 only, without zone IDs or IPv4-embedded spelling.
export function normalize6(value: string): string | undefined {
  const text = value.trim();
  if (!/^[0-9a-fA-F:]+$/.test(text) || !text.includes(":")) return undefined;
  try {
    const host = new URL(`http://[${text}]/`).hostname;
    return host.slice(1, -1);
  } catch {
    return undefined;
  }
}
export function address6(value: string): bigint {
  const normalized = normalize6(value);
  if (!normalized) throw Error("Valid hexadecimal IPv6 address required");
  const [left, right] = normalized.split("::");
  const a = left ? left.split(":") : [];
  const b = right ? right.split(":") : [];
  const groups = right === undefined ? a : [...a, ...Array<string>(8 - a.length - b.length).fill("0"), ...b];
  return groups.reduce((n, g) => (n << 16n) | BigInt(`0x${g}`), 0n);
}
export function equal6(a: string, b: string) {
  return !!normalize6(a) && normalize6(a) === normalize6(b);
}
export function prefix6(value: string, length: number): bigint {
  if (!Number.isInteger(length) || length < 0 || length > 128) throw Error("IPv6 prefix must be 0–128");
  const shift = BigInt(128 - length);
  return (address6(value) >> shift) << shift;
}
export function samePrefix6(a: string, b: string, length: number) {
  return prefix6(a, length) === prefix6(b, length);
}
export function network6(value: string, length: number) {
  const hex = prefix6(value, length).toString(16).padStart(32, "0");
  return `${normalize6(hex.match(/.{4}/g)!.join(":"))}/${length}`;
}
export function global6(value: string) {
  return !!normalize6(value) && address6(value) >> 125n === 1n;
}
