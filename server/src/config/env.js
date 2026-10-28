import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
  PORT: z.coerce.number().default(5001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  NEBIUS_API_KEY: z.string().optional().default(''),
  NEBIUS_BASE_URL: z.string().url().default('https://api.tokenfactory.nebius.com/v1/'),
  NEBIUS_MODEL: z.string().default('nvidia/Llama-3.1-Nemotron-70B-Instruct-HF'),
  GITHUB_TOKEN: z.string().optional().default(''),
  MONGODB_URI: z.string().optional().default(''),
  MAX_SCAN_FILES: z.coerce.number().default(30),
  MAX_FILE_SIZE_KB: z.coerce.number().default(250),
  MAX_ZIP_SIZE_MB: z.coerce.number().default(15),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

export const config = parsed.data;

export const isNebiusConfigured = () => {
  return Boolean(config.NEBIUS_API_KEY && config.NEBIUS_API_KEY.trim().length > 0);
};
