import { promises as fs } from "node:fs";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { z } from "zod";
import { MarketplaceListingInputSchema } from "./marketplace-contracts";

const listingSchema = z.object({ id: z.string(), details: MarketplaceListingInputSchema, createdAt: z.string() });
const orderSchema = z.object({ id: z.string(), listingId: z.string(), requestId: z.string(), task: z.string(), pricePaise: z.number().int(), status: z.enum(["RUNNING", "COMPLETED", "UNKNOWN"]), result: z.object({ text: z.string() }).nullable(), errorCode: z.string().nullable(), createdAt: z.string() });
const storeSchema = z.object({ listings: z.array(listingSchema), orders: z.array(orderSchema) });
type Store = z.infer<typeof storeSchema>;
type Shared = typeof globalThis & { __forgentMarketplaceQueue?: Promise<void> };
const shared = globalThis as Shared;
export function isLocalMarketplace() { return process.env.NODE_ENV === "development" && !process.env.DATABASE_URL?.trim(); }
export async function withLocalMarketplace<T>(action: (store: Store) => T, write = false): Promise<T> {
 const previous = shared.__forgentMarketplaceQueue || Promise.resolve();
 let release!: () => void;
 shared.__forgentMarketplaceQueue = new Promise<void>(resolve => { release = resolve; });
 await previous;
 try {
  const directory = process.env.FORGENT_DATA_DIR || path.join(process.cwd(), ".forgent-demo");
  const file = path.join(directory, "marketplace.json");
  let store: Store;
  try { store = storeSchema.parse(JSON.parse(await fs.readFile(file, "utf8"))); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") store = { listings: [], orders: [] }; else throw error; }
  const result = action(store);
  if (write) {
   await fs.mkdir(directory, { recursive: true });
   const temp = `${file}.${randomUUID()}.tmp`;
   try { await fs.writeFile(temp, JSON.stringify(store, null, 2), { mode: 0o600 }); await fs.rename(temp, file); }
   finally { await fs.rm(temp, { force: true }); }
  }
  return result;
 } finally { release(); }
}
