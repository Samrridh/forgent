import { lookup } from "node:dns/promises";
import { request as httpsRequest } from "node:https";
import { isIP } from "node:net";
import ipaddr from "ipaddr.js";
import { z } from "zod";

export const HostedTaskResponseSchema = z.strictObject({ result: z.string().trim().min(1).max(32000) });
export class HostedTaskError extends Error {}

export async function resolveHostedEndpoint(raw: string) {
  let url: URL;
  try { url = new URL(raw); } catch { throw new HostedTaskError("Enter a valid public HTTPS endpoint."); }
  if (url.protocol !== "https:" || url.username || url.password || url.hash || url.search || isIP(url.hostname.replace(/^\[|\]$/g, ""))) {
    throw new HostedTaskError("Use a public HTTPS hostname without credentials, query parameters, or fragments.");
  }
  let addresses: Awaited<ReturnType<typeof lookup>>[];
  try { addresses = await lookup(url.hostname, { all: true, verbatim: true }); }
  catch { throw new HostedTaskError("Could not resolve the endpoint hostname."); }
  if (!addresses.length || addresses.some(({ address }) => {
    try { const ip = ipaddr.process(address); return ip.range() !== "unicast"; } catch { return true; }
  })) throw new HostedTaskError("The endpoint must resolve only to public addresses.");
  return { url, address: addresses[0] };
}

export async function invokeHostedTask(endpoint: string, task: string): Promise<string> {
  const { url, address } = await resolveHostedEndpoint(endpoint);
  const body = JSON.stringify({ task });
  const raw = await new Promise<string>((resolve, reject) => {
    let total = 0;
    const chunks: Buffer[] = [];
    const request = httpsRequest({ hostname: url.hostname, port: url.port || 443, path: url.pathname, method: "POST", headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) }, family: address.family, lookup: (_name, _options, callback) => callback(null, address.address, address.family) }, (response) => {
      if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 300) { response.resume(); reject(new HostedTaskError("The agent endpoint returned an error.")); return; }
      response.on("data", (chunk: Buffer) => { total += chunk.length; if (total > 65536) request.destroy(new Error("Response too large")); else chunks.push(chunk); });
      response.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
      response.on("error", () => reject(new HostedTaskError("The agent response was interrupted.")));
    });
    const timer = setTimeout(() => request.destroy(new Error("Timeout")), 15000);
    request.on("close", () => clearTimeout(timer));
    request.on("error", () => reject(new HostedTaskError("The agent endpoint failed or timed out.")));
    request.end(body);
  });
  try { return HostedTaskResponseSchema.parse(JSON.parse(raw)).result; }
  catch { throw new HostedTaskError("The agent returned an invalid response."); }
}
