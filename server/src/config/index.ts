import "dotenv/config";

const config = {
  PORT: process.env.PORT || 3005,
  DATABASE_URL: process.env.DATABASE_URL || "file:./dev.db",
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET || "default_secret",
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || "http://localhost:3005",
  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID || "",
  GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET || "",
  GOOGLE_GENRATIVE_SECRET_AI_API_KEY:
    process.env.GOOGLE_GENRATIVE_SECRET_AI_API_KEY || "",
  CLI_MODEL: process.env.CLI_MODEL || "",
};

export default config;
