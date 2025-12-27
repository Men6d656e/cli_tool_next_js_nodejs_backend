import express from "express";
import cors from "cors";
import type { Request, Response } from "express";
import config from "./config/index.js";
import { auth } from "./lib/auth.js";
import { toNodeHandler } from "better-auth/node";

const app = express();
app.use(
  cors({
    origin: "http://localhost:3000", // Your Next.js URL
    credentials: true, // Required for Better Auth sessions/cookies
  })
);

app.all("/api/auth/{*any}", toNodeHandler(auth));
app.use(express.json());

app.get("/device", async (req: Request, res: Response) => {
  const { user_code } = req.query;
  res.redirect(`http://localhost:3000/device?user_code=${user_code}`)
});

app.get("/", (req: Request, res: Response) => {
  res.send("Hello, World!");
});

app.listen(config.PORT, () => {
  console.log(`Server is running on http://localhost:${config.PORT}`);
});
