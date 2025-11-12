// Client-side socket wrapper that lazy-loads socket.io functions
// This prevents socket.io-client from being bundled during SSR

let socketModule: any = null;

async function loadSocketModule() {
  if (!socketModule) {
    socketModule = await import("./socket");
  }
  return socketModule;
}

export async function initializeChatSocket(token?: string) {
  const mod = await loadSocketModule();
  return mod.initializeChatSocket(token);
}

export async function initializeNotificationSocket(token: string) {
  const mod = await loadSocketModule();
  return mod.initializeNotificationSocket(token);
}

export async function getChatSocket() {
  const mod = await loadSocketModule();
  return mod.getChatSocket();
}

export async function getNotificationSocket() {
  const mod = await loadSocketModule();
  return mod.getNotificationSocket();
}

export async function joinChatRoom(conversationId: string) {
  const mod = await loadSocketModule();
  return mod.joinChatRoom(conversationId);
}

export async function sendSocketMessage(
  conversationId: string,
  messageContent: string,
  senderId: string,
  senderType: string
) {
  const mod = await loadSocketModule();
  return mod.sendSocketMessage(conversationId, messageContent, senderId, senderType);
}

export async function sendTypingIndicator(
  conversationId: string,
  isTyping: boolean,
  userId: string
) {
  const mod = await loadSocketModule();
  return mod.sendTypingIndicator(conversationId, isTyping, userId);
}

export async function disconnectChatSocket() {
  const mod = await loadSocketModule();
  return mod.disconnectChatSocket();
}

export async function disconnectNotificationSocket() {
  const mod = await loadSocketModule();
  return mod.disconnectNotificationSocket();
}
