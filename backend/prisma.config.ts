import { defineConfig } from "@prisma/config";
import "dotenv/config"; // <--- This loads .env variables immediately

const getDatabaseUrl = () => {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  if (process.env.POSTGRES_URL) return process.env.POSTGRES_URL;
  if (process.env.POSTGRES_HOST) {
    const user = process.env.POSTGRES_USER || "postgres";
    const password = process.env.POSTGRES_PASSWORD || "";
    const host = process.env.POSTGRES_HOST;
    const port = process.env.POSTGRES_PORT || "5432";
    const dbName = process.env.POSTGRES_DATABASE || "postgres";
    return `postgresql://${user}:${encodeURIComponent(password)}@${host}:${port}/${dbName}?sslmode=require`;
  }
  return "postgresql://postgres:willfaa@127.0.0.1:5433/chainnesa_db?schema=public&connect_timeout=60";
};

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: getDatabaseUrl(),
  },
  migrations: {
    seed: "ts-node prisma/seed.ts",
  },
});
