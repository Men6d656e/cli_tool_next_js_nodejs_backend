// server/lib/db.js
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import Database from "better-sqlite3";

const sqlite = new Database("prisma/dev.db");
const adapter = new PrismaBetterSqlite3(sqlite);

export const db = new PrismaClient({ adapter });