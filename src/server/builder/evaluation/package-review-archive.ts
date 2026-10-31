import JSZip from "jszip";
import { z } from "zod";

const allowed = /\.(?:js|cjs|mjs|ts|json|md|txt)$/i;
const sensitive = /(?:^|\/)(?:\.env(?:\..*)?|\.npmrc|\.git|node_modules|id_rsa|id_ed25519)(?:\/|$)/i;
const secretPattern = /(?:-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\b(?:sk-[A-Za-z0-9_-]{20,}|AIza[\w-]{30,}|ghp_[A-Za-z0-9]{30,}))/;
const jsonObject = z.record(z.string(), z.json());

export function parseReviewSchema(raw: string): Record<string, z.infer<typeof z.json>> {
  return jsonObject.parse(JSON.parse(raw));
}

export async function inspectReviewArchive(data: ArrayBuffer) {
  if (data.byteLength === 0 || data.byteLength > 1024 * 1024) throw new Error("ZIP must be between 1 byte and 1 MB.");
  const zip = await JSZip.loadAsync(data);
  const entries = Object.values(zip.files).filter((entry) => !entry.dir);
  if (!entries.length || entries.length > 50) throw new Error("ZIP must contain between 1 and 50 files.");
  const files: { path: string; content: string }[] = [];
  let total = 0;
  for (const entry of entries) {
    const original = entry.unsafeOriginalName || entry.name;
    if (original !== entry.name || original.startsWith("/") || original.includes("\\") || /(^|\/)\.\.(\/|$)/.test(original) || sensitive.test(original)) throw new Error("Package contains an unsafe path or sensitive file. Remove it before review.");
    if (!allowed.test(original)) throw new Error(`Unsupported file in package: ${original}. Submit source and documentation files only.`);
    const internal = entry as typeof entry & { _data?: { uncompressedSize?: number } };
    const size = internal._data?.uncompressedSize;
    if (typeof size !== "number" || size > 100000) throw new Error("A file exceeds the 100 KB review limit.");
    total += size;
    if (total > 200000) throw new Error("Uncompressed package exceeds the 200 KB review limit.");
    const content = await entry.async("string");
    if (secretPattern.test(content)) throw new Error("A possible credential was found. Remove secrets before review.");
    files.push({ path: original, content });
  }
  return files;
}
