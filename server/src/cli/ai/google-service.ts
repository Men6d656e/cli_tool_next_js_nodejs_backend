import { google } from "@ai-sdk/google";
import config from "../../config/index.js";
import {
  streamText,
  type LanguageModel,
  type LanguageModelUsage,
  type ModelMessage,
} from "ai";
import chalk from "chalk";

interface AIResponse {
  content: string;
  finishReason?: string;
  usage: LanguageModelUsage;
}

export class AIService {
  private model: LanguageModel;
  constructor() {
    if (!config.GOOGLE_GENRATIVE_SECRET_AI_API_KEY) {
      throw new Error("Google Api Key is not set in env");
    }
    // Initialize the model
    this.model = google(config.CLI_MODEL || "gemini-1.5-flash");
  }

  /**
   * Sends messages and gets streaming response
   * @param messages - Array of model messages (history)
   * @param onChunk - Optional callback for each stream piece
   * @param tools - Optional tools for function calling
   * @returns Promise resolving to an AIResponse object
   */
  async sendMessage(
    messages: ModelMessage[],
    onChunk?: (chunk: string) => void,
    tools?: any,
    onToolCall = null
  ): Promise<AIResponse> {
    try {
      // const streamConfig = {
      //   model: this.model,
      //   messages: messages,
      // };
      const result = streamText({
        model: this.model,
        messages: messages,
        tools: tools,
      });

      let fullResponse = "";

      for await (const chunk of result.textStream) {
        fullResponse += chunk;
        if (onChunk) {
          onChunk(chunk);
        }
      }
      return {
        content: fullResponse,
        finishReason: await result.finishReason,
        usage: await result.usage,
      };
    } catch (error) {
      console.error(
        chalk.red("AI Service Error: "),
        error instanceof Error ? error.message : error
      );
      throw error;
    }
  }

  /**
   * Get a non-streaming response
   * @param messages - Array of model messages
   * @returns Promise resolving to the full string response
   */
  async getMessage(
    messages: ModelMessage[],
    tools = undefined
  ): Promise<string> {
    let fullResponse = "";
    await this.sendMessage(messages, (chunk) => {
      fullResponse += chunk;
    });
    return fullResponse;
  }
}
