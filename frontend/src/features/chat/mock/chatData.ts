import type { Conversation, Message } from '../types'

const minutesAgo = (minutes: number) =>
  new Date(Date.now() - minutes * 60_000).toISOString()

export const currentUserId = 'me'

export const conversations: Conversation[] = [
  { id: 'maya-shah', name: 'Maya Shah', lastMessage: 'That sounds like a great plan!', lastMessageAt: minutesAgo(2), unreadCount: 2, isOnline: true },
  { id: 'aarav-mehta', name: 'Aarav Mehta', lastMessage: 'Sent you the project files.', lastMessageAt: minutesAgo(18), unreadCount: 0, isOnline: true },
  { id: 'ananya-iyer', name: 'Ananya Iyer', lastMessage: 'Are we still meeting tomorrow?', lastMessageAt: minutesAgo(54), unreadCount: 1, isOnline: false },
  { id: 'rohan-kapoor', name: 'Rohan Kapoor', lastMessage: 'Haha, exactly 😄', lastMessageAt: minutesAgo(130), unreadCount: 0, isOnline: false },
  { id: 'isha-verma', name: 'Isha Verma', lastMessage: 'Photo', lastMessageAt: minutesAgo(240), unreadCount: 0, isOnline: true },
  { id: 'kabir-malhotra', name: 'Kabir Malhotra', lastMessage: 'Thanks for the recommendation!', lastMessageAt: minutesAgo(420), unreadCount: 0, isOnline: false },
  { id: 'sana-khan', name: 'Sana Khan', lastMessage: 'Voice message', lastMessageAt: minutesAgo(900), unreadCount: 3, isOnline: false },
  { id: 'dev-patel', name: 'Dev Patel', lastMessage: 'See you there!', lastMessageAt: minutesAgo(1440), unreadCount: 0, isOnline: true },
  { id: 'priya-nair', name: 'Priya Nair', lastMessage: 'You: Good morning!', lastMessageAt: minutesAgo(2880), unreadCount: 0, isOnline: false },
  { id: 'neel-joshi', name: 'Neel Joshi', lastMessage: 'Let me know what you think.', lastMessageAt: minutesAgo(4320), unreadCount: 0, isOnline: false },
]

const conversation = 'maya-shah'

export const messages: Message[] = [
  ['maya-1', conversation, 'Hey! How have you been?', 86, 'maya-shah'],
  ['maya-2', conversation, 'Doing well, thanks! How about you?', 82, currentUserId],
  ['maya-3', conversation, 'Pretty good! I finally started that design course I told you about.', 78, 'maya-shah'],
  ['maya-4', conversation, 'That’s awesome! How is it so far?', 73, currentUserId],
  ['maya-5', conversation, 'I love it. We’re working on a little group project this week.', 68, 'maya-shah'],
  ['maya-6', conversation, 'We’re making a simple app to help people find local events.', 67, 'maya-shah'],
  ['maya-7', conversation, 'I love that idea. There are always so many things happening nearby.', 61, currentUserId],
  ['maya-8', conversation, 'Exactly! We want to make it easier to discover them.', 56, 'maya-shah'],
  ['maya-9', conversation, 'Are you building it for web or mobile?', 51, currentUserId],
  ['maya-10', conversation, 'Starting with web, then we’ll see where it goes.', 47, 'maya-shah'],
  ['maya-11', conversation, 'Do you have any free time this weekend?', 42, 'maya-shah'],
  ['maya-12', conversation, 'I should be free on Saturday afternoon.', 37, currentUserId],
  ['maya-13', conversation, 'Would you like to grab coffee and take a look at our first draft?', 33, 'maya-shah'],
  ['maya-14', conversation, 'Sure! I’d be happy to help.', 29, currentUserId],
  ['maya-15', conversation, 'Amazing. I’ll send you the location.', 24, 'maya-shah'],
  ['maya-16', conversation, 'Perfect, looking forward to it!', 19, currentUserId],
  ['maya-17', conversation, 'There’s a new café near the park that looks lovely.', 12, 'maya-shah'],
  ['maya-18', conversation, 'I’ve been meaning to check that place out.', 8, currentUserId],
  ['maya-19', conversation, 'I’ll send you the address in a bit.', 4, 'maya-shah'],
  ['maya-20', conversation, 'That sounds like a great plan!', 2, 'maya-shah'],
].map(([id, conversationId, text, age, senderId]) => ({
  id: id as string,
  conversationId: conversationId as string,
  text: text as string,
  createdAt: minutesAgo(Number(age)),
  senderId: senderId as string,
  status: senderId === currentUserId ? 'read' as const : 'delivered' as const,
}))
