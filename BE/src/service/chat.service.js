import { Transaction } from "sequelize";
import { NotFoundError } from "../error/index.js";
import db from "../models/index.cjs";
import crypto from "crypto";
import process from "process";

class ChatService {
  #guestRepository;
  #conversationRepository;
  #notificationService;
  #messageRepository;
  #chatNamespace;

  constructor({
    guestRepository,
    conversationRepository,
    notificationService,
    messageRepository,
    chatNamespace,
  }) {
    this.#guestRepository = guestRepository;
    this.#conversationRepository = conversationRepository;
    this.#notificationService = notificationService;
    this.#messageRepository = messageRepository;
    this.#chatNamespace = chatNamespace;
  }

  startAnonymousChat = async ({ guestId, serviceCenterId, email }) => {
    const rawtResult = await db.sequelize.transaction(async (t) => {
      let actualGuestId = guestId;

      let guestEmail = email ? email.toLowerCase() : null;

      if (guestEmail) {
        const GUEST_TOKEN_SECRET = process.env.GUEST_TOKEN_SECRET;

        if (!GUEST_TOKEN_SECRET) {
          throw new Error(
            "GUEST_TOKEN_SECRET is not defined in environment variables."
          );
        }
        actualGuestId = crypto
          .createHash("sha256")
          .update(guestEmail + GUEST_TOKEN_SECRET)
          .digest("hex");
      }

      const guest = await this.#guestRepository.findOrCreate(
        actualGuestId,
        t,
        guestEmail
      );

      const conversation = await this.#conversationRepository.create(
        {
          guestId: guest.guestId,
        },
        t
      );

      return conversation;
    });

    const roomName = `service_center_staff_${serviceCenterId}`;
    const eventName = "newConversation";
    const data = {
      conversationId: rawtResult.id,
      guestId: rawtResult.guestId,
      serviceCenterId: serviceCenterId,
      email: email,
    };

    this.#notificationService.sendToRoom(roomName, eventName, data);

    return rawtResult;
  };

  resumeByEmail = async ({ email }) => {
    const guestEmail = email.toLowerCase();

    const GUEST_TOKEN_SECRET = process.env.GUEST_TOKEN_SECRET;

    if (!GUEST_TOKEN_SECRET) {
      throw new Error(
        "GUEST_TOKEN_SECRET is not defined in environment variables."
      );
    }

    const persistentGuestId = crypto
      .createHash("sha256")
      .update(guestEmail + GUEST_TOKEN_SECRET)
      .digest("hex");

    const guest = await this.#guestRepository.findById(persistentGuestId);

    if (!guest) {
      throw new NotFoundError("No conversations found for this email.");
    }

    const conversations =
      await this.#conversationRepository.getConversationsByGuestId(
        guest.guestId
      );

    return conversations;
  };

  joinAnonymousChat = async ({ userId, conversationId }) => {
    const rawResult = await db.sequelize.transaction(async (t) => {
      const existingConversation = await this.#conversationRepository.findById(
        {
          conversationId,
        },
        t,
        Transaction.LOCK.UPDATE
      );

      if (!existingConversation) {
        throw new NotFoundError("Conversation not found.");
      }

      const updatedConversation =
        await this.#conversationRepository.updateStaffId(
          conversationId,
          {
            staffId: userId,
            status: "ACTIVE",
          },
          t
        );

      return updatedConversation;
    });

    const room = `conversation_${conversationId}`;

    const event = "chatAccepted";

    const data = {
      conversationId: conversationId,
      staffId: userId,
    };

    this.#chatNamespace.to(room).emit(event, data);

    return rawResult;
  };

  sendMessage = async ({ conversationId, senderId, senderType, content }) => {
    const rawResult = await db.sequelize.transaction(async (t) => {
      const conversation = await this.#conversationRepository.findById(
        { conversationId },
        t
      );

      if (!conversation) {
        throw new NotFoundError("Conversation not found.");
      }

      const message = await this.#messageRepository.createMessage(
        { conversationId, senderId, senderType, content },
        t
      );

      await this.#conversationRepository.updateLastMessageAt(conversationId, t);

      return message;
    });

    return rawResult;
  };

  getMessages = async ({ conversationId }) => {
    const conversation = await this.#conversationRepository.findById({
      conversationId,
    });

    if (!conversation) {
      throw new NotFoundError("Conversation not found.");
    }

    const messages = await this.#messageRepository.getMessagesByConversation(
      conversationId
    );

    return messages;
  };

  getMyConversations = async ({ userId, status }) => {
    const conversations =
      await this.#conversationRepository.getConversationsByStaffId(
        userId,
        status
      );

    return conversations;
  };

  closeConversation = async ({ conversationId, userId }) => {
    const updatedConversation = await db.sequelize.transaction(async (t) => {
      const conversation = await this.#conversationRepository.findById(
        { conversationId },
        t
      );

      if (!conversation) {
        throw new NotFoundError("Conversation not found.");
      }

      if (conversation.staffId !== userId) {
        throw new Error("Only assigned staff can close this conversation.");
      }

      if (conversation.status !== "ACTIVE") {
        throw new Error("Conversation is not active.");
      }

      const updatedConversation =
        await this.#conversationRepository.closeConversation(conversationId, t);

      return updatedConversation;
    });

    const room = `conversation_${conversationId}`;
    const event = "conversationClosed";
    const data = {
      conversationId,
      closedBy: userId,
      closedAt: new Date(),
    };

    this.#chatNamespace.to(room).emit(event, data);

    return updatedConversation;
  };
}

export default ChatService;
