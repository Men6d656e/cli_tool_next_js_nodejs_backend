import boxen from "boxen";
import chalk, { Chalk } from "chalk";
import { isCancel, text, cancel, intro, outro, confirm } from "@clack/prompts";
import { AIService } from "../ai/google-service.js";
import { ChatService } from "../../service/chat.service.js";
import { getStoredToken } from "../commands/token.js";
import { prisma } from "../../lib/db.js";
import { generateApplication } from "../../config/agent.config.js";
import type { Role } from "../../generated/prisma/enums.js";

const aiService = new AIService();
const chatService = new ChatService();

async function getUserFromToken() {
  const token = await getStoredToken();
  if (!token?.access_token) {
    throw new Error("Not Authenticated. Please login first.");
  }

  const spinner = yoctoSpinner({ text: "Authenticating..." }).start();

  const user = await prisma.user.findFirst({
    where: {
      sessions: {
        some: { token: token.access_token },
      },
    },
  });

  if (!user) {
    spinner.error("User not found");
    throw new Error("User not found. Please login again.");
  }
  spinner.success(`Welcome back, ${user.name}!`);
  return user;
}

async function initConversation(userId, conversationId) {
  const conversation = await chatService.getOrCreateConversation(
    userId,
    conversationId,
    "agent"
  );

  const conversationInfo = boxen(
    `${chalk.bold("Conversation")}: ${conversation.title}\n` +
      `${chalk.gray("ID:")}: ${conversation.id}\n` +
      `${chalk.gray("Mode:")}: ${chalk.magenta("Agent (Code Generator)")}\n` +
      `${chalk.cyan("Working Directory")}: ${process.cwd}\n`,
    {
      padding: 1,
      margin: { top: 1, bottom: 1 },
      borderStyle: "round",
      borderColor: "magenta",
      title: "Agent Mode",
      titleAlignment: "center",
    }
  );

  console.log(conversationInfo);
  return conversation;
}
async function saveMessage(conversationId, role: Role, content) {
  return await chatService.addMessage(conversationId, role, content);
}

async function agentLoop(conversation: any) {
  const helpBox = boxen(
    `${chalk.cyan.bold("What can the agent do?")}\n\n` +
      `${chalk.gray("- Genrate complete applications for descriptons")}\n` +
      `${chalk.gray("- Create all necessary files and folders")}\n` +
      `${chalk.gray("- Include setup instructions and commands")}\n` +
      `${chalk.gray("- Genrate production-ready code")}\n\n` +
      `${chalk.yellow.bold("Examples: ")}\n` +
      `${chalk.white("- Build a todo app with React and Tailwind")}\n` +
      `${chalk.white("- Create a REST API with Express and MongoDB")}\n` +
      `${chalk.white("- Make a weather app using OpenWeatherMap API")}\n\n` +
      `${chalk.gray("Type 'exit' to end the session")}\n\n`,
    {
      padding: 1,
      margin: { bottom: 1 },
      borderStyle: "round",
      borderColor: "cyan",
      title: "Agent Instructions",
    }
  );

  console.log(helpBox);

  while (true) {
    const userInput = await text({
      message: chalk.magenta("What would you like to build?"),
      placeholder: "Describe your application",
      validate(value) {
        if (!value || value.trim().length === 0) {
          return "Description cannot be empty";
        }
        if (value.trim().length < 10) {
          return "Please provide more details (at least 10 characters)";
        }
      },
    });

    if (isCancel(userInput)) {
      console.log(chalk.yellow("Agent session cancelled\n"));
      process.exit(0);
    }

    if (userInput.toLocaleLowerCase() === "exit") {
      console.log(chalk.yellow("\n Agent session ended\n"));
      break;
    }

    const userBox = boxen(chalk.white(userInput), {
      padding: 1,
      margin: { top: 1, bottom: 1 },
      borderColor: "blue",
      borderStyle: "round",
      title: "Your Request",
      titleAlignment: "left",
    });

    console.log(userBox);

    await saveMessage(conversation.id, "USER", userInput);
    try {
      const result = await generateApplication(
        userInput,
        aiService,
        process.cwd()
      );
      if (result && result.success) {
        const responseMessage =
          `Generated application: ${result.folderName}\n` +
          `Files created: ${result.files.length}\n` +
          `Location: ${result.appDir}\n\n` +
          `Setup commands:\n${result.commands.join("\n")}`;

        await saveMessage(conversation.id, "ASSISTANT", responseMessage);
        const continuePrompts = await confirm({
          message: chalk.cyan(
            "Would you like to generate another application?"
          ),
          initialValue: false,
        });

        if (isCancel(continuePrompts) || !continuePrompts) {
          console.log(chalk.yellow("\n Greate! Check your new application.\n"));
          break;
        }
      } else {
        throw new Error("Generation returned no result");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : error;
      console.log(chalk.red(`\n Error: ${message}\n`));
      await saveMessage(conversation.id, "ASSISTANT", `Error: ${message}`);

      const retry = await confirm({
        message: chalk.cyan("Would you like to tryagain?"),
        initialValue: true,
      });

      if (isCancel(retry) || !retry) {
        break;
      }
    }
  }
}

export async function startAgentChat(conversationId: string | null = null) {
  try {
    intro(
      boxen(
        chalk.bold.magenta("CLI AI - Agent Mode\n\n") +
          chalk.gray("Autonomous Application Genrator"),
        {
          padding: 1,
          borderColor: "magenta",
          borderStyle: "double",
        }
      )
    );

    const user = await getUserFromToken();

    const shouldContinue = await confirm({
      message: chalk.yellow(
        "The agent will create files and folders in the current directory, Continue?"
      ),
      initialValue: true,
    });

    if (isCancel(shouldContinue) || !shouldContinue) {
      cancel(chalk.yellow("Agent mode canceled"));
      process.exit(0);
    }

    const conversation = await initConversation(user.id, conversationId);

    await agentLoop(conversation);

    outro(chalk.green.bold("\n Thanks for using Agent Mode!"));
  } catch (error) {
    const message = error instanceof Error ? error.message : error;
    const errorBox = boxen(chalk.red(`Error: ${message}`), {
      padding: 1,
      margin: 1,
      borderStyle: "round",
      borderColor: "red",
    });
    console.log(errorBox);
    process.exit(1);
  }
}
