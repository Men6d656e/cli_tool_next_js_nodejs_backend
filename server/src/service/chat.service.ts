import type { Conversation, Message } from "../generated/prisma/browser.js";
import type { Role } from "../generated/prisma/enums.js";
import { prisma } from "../lib/db.js";

export class ChatService {
  /**
   * Create a new conversation
   * @params {string} userId - User Id
   * @params {string} mode - chat, tool, or agent
   * @params {string} title - optional conversation title
   */
  async createConversation(
    userId: string,
    mode: string = "chat",
    title: string | null = null
  ) {
    return prisma.conversation.create({
      data: {
        userId,
        mode,
        title: title || `New ${mode} conversation`,
      },
    });
  }

  /** Get or Create a conversation for user
   * @params {string} userId - User ID
   * @params {string} conversationId - Optional conversation ID
   * @params {string} mode - chat, tool or agent
   *
   */
  async getOrCreateConversation(
    userId: string,
    conversationId: string | null = null,
    mode: string = "chat"
  ) {
    if (conversationId) {
      const conversation = await prisma.conversation.findFirst({
        where: {
          id: conversationId,
          userId,
        },
        include: {
          messages: {
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      });
      if (conversation) return conversation;
    }
    return await this.createConversation(userId, mode);
  }

  /**Add a messages to conversation
   * @params {string} conversationId - Conversation ID
   * @params {string} role - USER, ASSISTANT, SYSTEM, TOOL
   * @params {string|object} content - Message content
   */
  //   TODO type ROLE is from genrated dir change this in production
  async addMessage(conversationId: string, role: Role, content: string) {
    // convert the content into json string if it's an object
    const contentStr =
      typeof content === "string" ? content : JSON.stringify(content);

    return await prisma.message.create({
      data: {
        content: contentStr,
        role: role,
        conversationId,
      },
    });
  }

  /**
   * Get conversation messages
   * @params {string} conversationId - Conversation ID
   */
  async getMessages(conversationId: string): Promise<Message[]> {
    const message = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
    });
    // Parse JSON content back to objects if needed
    return message.map((msg) => ({
      ...msg,
      content: this.parseContent(msg.content),
    }));
  }

  /**
   * Get all conversations for a user
   * @params {string} userId - User ID
   */
  async getUserConversation(userId: string): Promise<Conversation[]> {
    return await prisma.conversation.findMany({
      where: {
        userId,
      },
      orderBy: {
        updatedAt: "desc",
      },
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
    });
  }

  /**
   * Delete a conversation
   * @params {string} conversationId - Conversation ID
   * @params {String} userId - User ID (for security)
   */
  async deleteConversation(conversationId: string, userId: string) {
    return await prisma.conversation.deleteMany({
      where: {
        id: conversationId,
        userId,
      },
    });
  }

  /**
   * Update conversation title
   * @params {string} conversationId - Conversation ID
   * @params {string} title - New title
   */
  async updateTitle(conversationId: string, title: string) {
    return await prisma.conversation.update({
      where: { id: conversationId },
      data: { title },
    });
  }

  /**
   * Helper to parse content (JSON or string)
   */
  parseContent(content: string) {
    try {
      return JSON.parse(content);
    } catch (error) {
      return content;
    }
  }

  /**
   * Format messages for AI SDK
   * @params {Array} messages - Database messages
   */

  formatMessagesForAI(messages: { role: Role; content: string }[]) {
    return messages.map((msg) => ({
      role: msg.role,
      content:
        typeof msg.content === "string"
          ? msg.content
          : JSON.stringify(msg.content),
    }));
  }
}
