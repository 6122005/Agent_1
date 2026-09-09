import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env from root or current directory
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config(); // fallback to local server/.env if present

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5001'),
  CLIENT_URL: z.string().default('http://localhost:5173'),

  // Database
  MONGODB_URI: z.string().optional().default(''),

  // Auth / Security
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters').default('development_jwt_secret_key_32bytes_minimum!'),
  ENCRYPTION_KEY: z.string().length(64, 'ENCRYPTION_KEY must be a 64-character hex string (32 bytes)').default('b4a13a49b47203e1636e4c9e236aa83d4bec11ff6ef5d52f1e073608767edfbc'),

  // Google
  GOOGLE_CLIENT_ID: z.string().optional().default(''),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(''),
  GOOGLE_REDIRECT_URI: z.string().default('http://localhost:5001/api/auth/google/callback'),

  // Telegram
  TELEGRAM_BOT_TOKEN: z.string().optional().default(''),
  TELEGRAM_WEBHOOK_SECRET: z.string().optional().default('sec_telegram_webhook_secret_key'),

  // WhatsApp (Meta Cloud API)
  WHATSAPP_ACCESS_TOKEN: z.string().optional().default(''),
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional().default(''),
  WHATSAPP_VERIFY_TOKEN: z.string().optional().default('meta_verify_token_assistant'),

  // Twilio WhatsApp fallback
  TWILIO_ACCOUNT_SID: z.string().optional().default(''),
  TWILIO_AUTH_TOKEN: z.string().optional().default(''),
  TWILIO_WHATSAPP_NUMBER: z.string().optional().default(''),

  // LLM Provider
  GEMINI_API_KEY: z.string().optional().default(''),
  GROQ_API_KEY: z.string().optional().default(''),
  OPENAI_API_KEY: z.string().optional().default(''),
  ANTHROPIC_API_KEY: z.string().optional().default(''),

  // CRM: HubSpot
  HUBSPOT_PRIVATE_APP_TOKEN: z.string().optional().default(''),

  // Scheduler
  DEFAULT_TIMEZONE: z.string().default('Asia/Amman'),
  MORNING_SUMMARY_TIME: z.string().default('08:00'),
  EVENING_SUMMARY_TIME: z.string().default('19:00'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Environment validation failed:', JSON.stringify(parsedEnv.error.format(), null, 2));
  process.exit(1);
}

export const env = parsedEnv.data;
