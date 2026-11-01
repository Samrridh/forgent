import { db } from "@/server/db";
import type { DemoStore } from "./contracts";

// A single row keeps the existing local demo's shared workspace consistent across serverless instances.
export async function withDatabaseDemoStore<T>(action: (store: DemoStore) => T | Promise<T>, initial: () => DemoStore, parse: (value: unknown) => DemoStore, write: boolean): Promise<T> {
  return db.$transaction(async transaction => {
    await transaction.$executeRaw`CREATE TABLE IF NOT EXISTS forgent_demo_workspace (id TEXT PRIMARY KEY, data JSONB NOT NULL)`;
    await transaction.$executeRaw`INSERT INTO forgent_demo_workspace (id, data) VALUES ('default', ${JSON.stringify(initial())}::jsonb) ON CONFLICT (id) DO NOTHING`;
    const rows = await transaction.$queryRaw<{ data: unknown }[]>`SELECT data FROM forgent_demo_workspace WHERE id = 'default' FOR UPDATE`;
    if (!rows[0]) throw new Error("Demo workspace is unavailable.");
    const store = parse(rows[0].data);
    const result = await action(store);
    if (write) await transaction.$executeRaw`UPDATE forgent_demo_workspace SET data = ${JSON.stringify(store)}::jsonb WHERE id = 'default'`;
    return result;
  }, { maxWait: 10000, timeout: 90000 });
}
