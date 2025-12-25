// server/lib/auth.js
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "./db.js"; // Import the client we just fixed

export const auth = betterAuth({
    database: prismaAdapter(db, {
        provider: "sqlite",
    }),
    emailAndPassword: {
        enabled: true
    }
});