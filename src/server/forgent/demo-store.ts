import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID, createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import { ArticleSchema, type DemoStore, type DemoKey } from "./contracts";
import { DemoListingSchema } from "./demo-listing-contract";

const keySchema = z.object({ id:z.string(), name:z.string(), prefix:z.string(), hash:z.string(), createdAt:z.string(), revokedAt:z.string().nullable() });
const storeSchema = z.object({ version:z.literal(1), demoListings:z.array(DemoListingSchema).default([]), keys:z.array(keySchema), articles:z.array(ArticleSchema), runs:z.array(z.unknown()), handoffs:z.array(z.unknown()), agents:z.array(z.unknown()).default([]), discordStatus:z.unknown().optional() });
const initialStore = (): DemoStore => ({ version: 1, keys: [], runs: [], handoffs: [], agents: [], articles: [
  { id: "getting-started", title: "Getting started with Northstar", content: "To invite your team, open Settings, select Members, and choose Invite member. Enter their email address and send the invitation. Invitations expire after seven days." },
  { id: "reset-password", title: "Reset your password", content: "To reset your password, open the sign-in page and select Forgot password. Enter your account email and follow the reset link. The link expires after one hour." },
  { id: "notifications", title: "Manage notifications", content: "To change email notifications, open Settings, select Notifications, and choose the updates you want to receive. Select Save changes to apply your preferences." },
] });
type QueueGlobal = typeof globalThis & { __forgentStoreQueue?: Promise<void> };
const shared = globalThis as QueueGlobal;
function filePath() { return path.join(process.env.FORGENT_DATA_DIR || path.join(process.cwd(), ".forgent-demo"), "store.json"); }
async function readStore(): Promise<DemoStore> {
  try {
    const parsed: unknown = JSON.parse(await fs.readFile(filePath(), "utf8"));
    const checked = storeSchema.parse(parsed);
    return checked as DemoStore;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return initialStore();
    throw error;
  }
}
export async function withDemoStore<T>(fn: (store: DemoStore) => T | Promise<T>, write = false): Promise<T> {
  const prior = shared.__forgentStoreQueue || Promise.resolve();
  let release!: () => void;
  shared.__forgentStoreQueue = new Promise<void>(resolve => { release = resolve; });
  await prior;
  try {
    const store = await readStore();
    const result = await fn(store);
    if (write) {
      const target = filePath();
      await fs.mkdir(path.dirname(target), { recursive: true });
      const temp = `${target}.${randomUUID()}.tmp`;
      try { await fs.writeFile(temp, JSON.stringify(store, null, 2), { mode: 0o600 }); await fs.rename(temp, target); }
      finally { await fs.rm(temp, { force: true }); }
    }
    return result;
  } finally { release(); }
}
export function hashSecret(value:string) { return createHash("sha256").update(value).digest("hex"); }
export function newKey(name:string): { secret:string; key:DemoKey } {
  const secret = `fg_${randomBytes(32).toString("base64url")}`;
  return { secret, key: { id:randomUUID(), name, prefix:secret.slice(0, 10), hash:hashSecret(secret), createdAt:new Date().toISOString(), revokedAt:null } };
}
export function publicKey(key:DemoKey) { const { hash: _hash, ...safe } = key; void _hash; return safe; }
