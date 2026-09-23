import { createHash, timingSafeEqual } from "node:crypto";

export function checkMacValue(fields: Record<string, string>, hashKey: string, hashIv: string) {
  const sorted = Object.entries(fields)
    .filter(([key]) => key.toLowerCase() !== "checkmacvalue")
    .sort(([left], [right]) => left.toLowerCase().localeCompare(right.toLowerCase(), "en"));
  const raw = `HashKey=${hashKey}&${sorted.map(([key, value]) => `${key}=${value}`).join("&")}&HashIV=${hashIv}`;
  const encoded = new URLSearchParams({ raw }).toString().slice(4)
    .replace(/%2d/gi, "-")
    .replace(/%5f/gi, "_")
    .replace(/%2e/gi, ".")
    .replace(/%21/gi, "!")
    .replace(/%2a/gi, "*")
    .replace(/%28/gi, "(")
    .replace(/%29/gi, ")")
    .toLowerCase();
  return createHash("sha256").update(encoded, "utf8").digest("hex").toUpperCase();
}

export function verifyEcpayMac(fields: Record<string, string>, hashKey: string, hashIv: string) {
  if (!hashKey || !hashIv || !/^[A-Fa-f0-9]{64}$/.test(fields.CheckMacValue || "")) return false;
  const received = Buffer.from(fields.CheckMacValue.toUpperCase(), "utf8");
  const expected = Buffer.from(checkMacValue(fields, hashKey, hashIv), "utf8");
  return timingSafeEqual(received, expected);
}
