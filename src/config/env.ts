import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  PORT: z.coerce
    .number()
    .int()
    .positive()
    .default(5000),

  DATABASE_URL: z.string().min(1),

  JWT_SECRET: z.string().min(32),

  JWT_ACCESS_SECRET: z.string().min(32).optional(),

  JWT_REFRESH_SECRET: z.string().min(32).optional(),

  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),

  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
}).transform((data) => ({
  ...data,
  JWT_ACCESS_SECRET: data.JWT_ACCESS_SECRET ?? data.JWT_SECRET,
  JWT_REFRESH_SECRET: data.JWT_REFRESH_SECRET ?? data.JWT_SECRET,
}));

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("Invalid environment variables:");
  console.error(parsedEnv.error.flatten().fieldErrors);

  process.exit(1);
}

export const env = parsedEnv.data;