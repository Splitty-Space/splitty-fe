/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  // next dev would append its own agent block to AGENTS.md; we keep a docs pointer there instead (#29).
  agentRules: false,
  // Next.js inlines only the env variables that are set. Defaulting the Telegram mock flag
  // to "false" lets a normal build drop the mock (utils/mockTelegramEnv.ts) instead of
  // shipping it switched off.
  env: {
    NEXT_PUBLIC_MOCK_TELEGRAM_ENV: process.env.NEXT_PUBLIC_MOCK_TELEGRAM_ENV ?? "false",
  },
};

export default nextConfig;
