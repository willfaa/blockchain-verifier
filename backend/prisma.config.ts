import { defineConfig } from "@prisma/config";
import "dotenv/config"; // <--- This loads .env variables immediately

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL,
  },
  migrations: {
    seed: "ts-node prisma/seed.ts",
  },
});
