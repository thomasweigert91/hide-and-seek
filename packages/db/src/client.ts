import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index";
import "dotenv/config";

let client: postgres.Sql | null = null;
let dbInstance: PostgresJsDatabase<typeof schema> | null = null;

export function getDb(
  connectionString?: string,
): PostgresJsDatabase<typeof schema> {
  const connectionUrl = connectionString ?? process.env.DATABASE_URL;
  if (!connectionUrl) {
    throw new Error("DATABASE_URL environment variable is not defined.");
  }

  if (!client) {
    // prepare: false is required when using Supabase transaction pooler (port 6543)
    client = postgres(connectionUrl, {
      prepare: false,
    });
    dbInstance = drizzle(client, { schema });
  }

  return dbInstance!;
}

export const db: PostgresJsDatabase<typeof schema> = new Proxy(
  {} as PostgresJsDatabase<typeof schema>,
  {
    get(_target, prop) {
      const database = getDb();
      return (database as unknown as Record<string | symbol, unknown>)[prop];
    },
  },
);
