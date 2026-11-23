/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  // next dev would append its own agent block to AGENTS.md; we keep a docs pointer there instead (#29).
  agentRules: false,
};

export default nextConfig;
