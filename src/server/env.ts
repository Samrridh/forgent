import "dotenv/config";
import { z } from "zod";

const DEFAULT_DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/forgent_dev?schema=public";

const envSchema = z.object({
  DATABASE_URL: z.string().optional().default(DEFAULT_DATABASE_URL),
  DATABASE_URL_POOLED: z.string().optional(),
  DIRECT_URL: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().default("http://localhost:3000"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  AUTH_SECRET: z.string().optional(),
  AUTH_GOOGLE_ID: z.string().optional(),
  AUTH_GOOGLE_SECRET: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().optional(),
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  QSTASH_TOKEN: z.string().optional(),
  QSTASH_CURRENT_SIGNING_KEY: z.string().optional(),
  QSTASH_NEXT_SIGNING_KEY: z.string().optional(),
  UPLOADTHING_TOKEN: z.string().optional(),
});

function getEnv() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("Invalid environment variables:", parsed.error.format());
    throw new Error("Invalid environment variables");
  }

  const envData = parsed.data;
  const resolvedDbUrl = envData.DATABASE_URL && envData.DATABASE_URL.trim() !== "" 
    ? envData.DATABASE_URL 
    : DEFAULT_DATABASE_URL;
  const directUrl = envData.DIRECT_URL || resolvedDbUrl.replace("-pooler.", ".");

  return {
    ...envData,
    DATABASE_URL: resolvedDbUrl,
    DIRECT_URL: directUrl,
  };
}

export const env = getEnv();
