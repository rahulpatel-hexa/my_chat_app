import { io, type Socket } from 'socket.io-client'
import type { ConversationMessage } from './messagesApi'

type ServerToClientEvents = {
  'message:new': (message: ConversationMessage) => void
  'message:read': (update: {
    conversationId: string
    messageIds: string[]
    readerId: string
  }) => void
  'presence:update': (presence: {
    userId: string
    isOnline: boolean
    lastSeen: string | null
  }) => void
}

type ClientToServerEvents = {
  'conversation:join': (
    payload: { conversationId: string },
    acknowledge: (response: { success: boolean; conversationId?: string; error?: string }) => void,
  ) => void
  'conversation:leave': (payload: { conversationId: string }) => void
}

export type ChatSocket = Socket<ServerToClientEvents, ClientToServerEvents>

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api/v1'
const socketUrl = import.meta.env.VITE_SOCKET_URL ?? new URL(apiUrl).origin

export function createChatSocket(accessToken: string): ChatSocket {
  return io(socketUrl, {
    autoConnect: false,
    auth: { token: accessToken },
    withCredentials: true,
  })
}
