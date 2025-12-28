#!/usr/bin/env node

import dotenv from "dotenv";
import chalk from "chalk";
import figlet from "figlet";
import { Command } from "commander";
import { login, logout, whoami } from "./commands/auth/login.js";
import { wakeUp } from "./commands/ai/wakeUp.js";
dotenv.config();

async function main() {
  //Display Banner
  console.log(
    chalk.cyan(
      figlet.textSync("C L I", {
        font: "Standard",
        horizontalLayout: "default",
        // verticalLayout: "default",
      })
    )
  );

  console.log(chalk.gray("\nA cli based AI Tool \n"));

  const program = new Command("chala-ra-cli");
  program
    .version("0.0.1")
    .description("CLI -A cli Based AI Tool")
    .addCommand(login)
    .addCommand(logout)
    .addCommand(whoami)
    .addCommand(wakeUp);

  program.action(() => {
    program.help();
  });

  program.parse();
}

main().catch((err) => {
  console.log(chalk.red("Error starting CLI: "), err);
  process.exit(1);
});
