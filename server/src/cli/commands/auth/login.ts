import { cancel, confirm, intro, isCancel, outro } from "@clack/prompts";
import { betterAuth, logger } from "better-auth";
import { createAuthClient } from "better-auth/client";
import { deviceAuthorizationClient } from "better-auth/client/plugins";
import chalk, { Chalk } from "chalk";
import { Command } from "commander";
import fs from "fs/promises";
import open from "open";
import os from "os";
import path from "path";
import yoctoSpinner from "yocto-spinner";
import * as z from "zod";

import dotenv from "dotenv";
import { prisma } from "../../../lib/db.js";
import config from "../../../config/index.js";
import {
  clearStoredToken,
  getStoredToken,
  isTokenExpired,
  requiredAuth,
  storeToken,
} from "../token.js";

dotenv.config();

const URL = "http://localhost:3005";
const CLIENT_ID = config.GITHUB_CLIENT_ID;
export const CONFIG_DIR = path.join(os.homedir(), ".orbital-cli");
export const TOKEN_FILE = path.join(CONFIG_DIR, "token.json");

// TOKEN MANAGEMENT

export async function loginAction(opts: any) {
  const schema = z.object({
    serverUrl: z.string().optional(),
    clientId: z.string().optional(),
  });

  const validatedOptions = schema.parse(opts);
  const serverUrl = validatedOptions.serverUrl || URL;
  const clientId = validatedOptions.clientId || CLIENT_ID;

  intro(chalk.bold("🔒 Auth Cli Login"));

  //   TODO CHANGE THIS WITH TOKEN MANAGEMENT UTILS
  const existingToken = await getStoredToken();
  const expired = await isTokenExpired();

  if (existingToken && !expired) {
    const shouldReAuth = await confirm({
      message: "You are already loogedIn. Do you want to login Again?",
      initialValue: false,
    });
    if (isCancel(shouldReAuth) || !shouldReAuth) {
      cancel("Login Cancelled");
      process.exit(0);
    }
  }

  const authClient = createAuthClient({
    baseURL: serverUrl,
    plugins: [deviceAuthorizationClient()],
  });

  const spinner = yoctoSpinner({ text: "Requesting device authorization..." });

  spinner.start();

  try {
    const { data, error } = await authClient.device.code({
      client_id: clientId,
      scope: "openid profile email",
    });
    spinner.stop();

    if (error || !data) {
      logger.error(
        `Failed to requested device authorization: ${error.error_description}`
      );
      process.exit(1);
    }

    const {
      device_code,
      expires_in,
      interval,
      user_code,
      verification_uri_complete,
      verification_uri,
    } = data;

    console.log(chalk.cyan("Device Authorization Required"));
    console.log(
      `Please Visit ${chalk.underline.blue(
        verification_uri || verification_uri_complete
      )}`
    );

    console.log(`Enter Code: ${chalk.bold.green(user_code)}`);
    const shouldOPen = await confirm({
      message: "Open browser automatically",
      initialValue: true,
    });
    if (!isCancel(shouldOPen) && shouldOPen) {
      const urlToOPen = verification_uri_complete || verification_uri;
      await open(urlToOPen);
    }

    console.log(
      chalk.gray(
        `Waiting for authorization (expires in ${Math.floor(
          expires_in / 60
        )}minutes)...)`
      )
    );

    const token = await pollForToken(
      authClient,
      device_code,
      clientId,
      interval
    );
    if (token) {
      const saved = await storeToken(token);
      if (!saved) {
        console.log(
          chalk.yellow("\n Warning: Clould not save authentication token.\n")
        );
        console.log(chalk.yellow("You may need to login on next use."));
      }
    }

    // todo get the user data
    const user = await prisma.user.findFirst();

    outro(chalk.green("Login Successfull!"));

    console.log(chalk.gray(`\n  Token saved to: ${TOKEN_FILE}`));
  } catch (error: any) {
    spinner.stop();
    console.log(chalk.red("\n Login failed: "), error.message);
    process.exit(1);
  }
}

async function pollForToken(
  authClient,
  deviceCode,
  client_id,
  initialIntervalue
) {
  let pollingInterval = interval;

  const spinner = yoctoSpinner({ text: "", color: "cyan" });
  let dots = 0;

  return new Promise((resolve, _) => {
    const poll = async () => {
      dots = (dots + 1) % 4;
      spinner.text = chalk.gray(
        `Pooling for authorization${".".repeat(dots)}${" ".repeat(3 - dots)}`
      );
      if (!spinner.isSpinning) spinner.start();

      try {
        const { data, error } = await authClient.device.token({
          grant_type: "urn:ietf:params:oauth:grant-type:device_code",
          device_code: deviceCode,
          client_id: "demo-cli",
        });

        if (data?.access_token) {
          console.log("\nAuthorization Successful!");
          console.log("Access token received!");

          spinner.stop();
          resolve(data);
          return;
        } else if (error) {
          switch (error.error) {
            case "authorization_pending":
              // Continue polling silently
              break;
            case "slow_down":
              pollingInterval += 5;
              console.log(`⚠️  Slowing down polling to ${pollingInterval}s`);
              break;
            case "access_denied":
              console.error("❌ Access was denied by the user");
              process.exit(1);
              break;
            case "expired_token":
              console.error(
                "❌ The device code has expired. Please try again."
              );
              process.exit(1);
              break;
            default:
              spinner.stop();
              logger.error(`❌ Error: ${error.error_description}`);
              process.exit(1);
          }
        }
      } catch (error: any) {
        spinner.stop();
        logger.error(`Network error: ${error.message}`);
        process.exit(1);
      }
      setTimeout(poll, pollingInterval * 1000);
    };
    setTimeout(poll, pollingInterval * 1000);
  });
}

export async function logoutAction() {
  intro(chalk.bold("Logout"));

  const token = await getStoredToken();
  if (!token) {
    console.log(chalk.yellow("You're not logged in."));
    process.exit(0);
  }

  const shouldLogout = await confirm({
    message: "Are you Sure you want to logout?",
    initialValue: false,
  });

  if (isCancel(shouldLogout) || !shouldLogout) {
    cancel("Logout cancelled!");
  }

  const cleared = await clearStoredToken();

  if (cleared) {
    outro(chalk.green("Successfully logged out!"));
  } else {
    console.log(chalk.yellow("Could not clear token file."));
  }
}

export async function whoamiAction() {
  const token = await requiredAuth();
  if (!token.access_token) {
    console.log("No access token found. Please login.");
    process.exit(1);
  }

  const user = await prisma.user.findFirst({
    where: {
      sessions: {
        some: {
          token: token.access_token,
        },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
    },
  });

  console.log(
    chalk.bold.greenBright(`\n User: ${user?.name}
      Email: ${user?.email}
      ID: ${user?.id}
      `)
  );
}

// COMMAND SETUP
export const login = new Command("login")
  .description("login to better Auth")
  .option("--server-url <url>", "The Better Auth Server URL", URL)
  .option("--client-id <id>", "The OAuth client ID", CLIENT_ID)
  .action(loginAction);

export const logout = new Command("logout")
  .description("Logout and clear stored credentials")
  .action(loginAction);

export const whoami = new Command("whoami")
  .description("Show current authenticate user")
  .option("--server-url <url>", "The Better Auth Server URl", URL)
  .action(whoamiAction);
