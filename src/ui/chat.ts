import type { BuyerRequest, Listing, Message } from '../types';

export interface Conversation {
  key: string;
  listingId?: string;
  requestId?: string;
  itemTitle: string;
  otherId: string;
  otherName: string;
  messages: Message[];
  lastAt: number;
}

export interface ChatTarget {
  listingId?: string;
  requestId?: string;
  itemTitle: string;
  otherId: string;
  otherName: string;
}

export function conversationKey(target: {
  listingId?: string;
  requestId?: string;
  otherId: string;
}): string {
  return `${target.listingId ? `l:${target.listingId}` : `r:${target.requestId}`}|${target.otherId}`;
}

/** Groups a member's messages into one conversation per item and counterparty, newest first. */
export function buildConversations(
  messages: Message[],
  userId: string,
  listings: Listing[],
  requests: BuyerRequest[]
): Conversation[] {
  const byKey = new Map<string, Conversation>();

  for (const message of messages) {
    if (message.senderId !== userId && message.recipientId !== userId) continue;
    const mine = message.senderId === userId;
    const otherId = mine ? message.recipientId : message.senderId;
    const key = conversationKey({
      listingId: message.listingId,
      requestId: message.requestId,
      otherId,
    });

    let conversation = byKey.get(key);
    if (!conversation) {
      const title = message.listingId
        ? listings.find((l) => l.id === message.listingId)?.title
        : requests.find((r) => r.id === message.requestId)?.title;
      conversation = {
        key,
        listingId: message.listingId,
        requestId: message.requestId,
        itemTitle: title || 'Item no longer listed',
        otherId,
        otherName: (mine ? message.recipientName : message.senderName) || 'Member',
        messages: [],
        lastAt: 0,
      };
      byKey.set(key, conversation);
    }
    conversation.messages.push(message);
    conversation.lastAt = Math.max(conversation.lastAt, message.createdAt);
  }

  const conversations = [...byKey.values()];
  conversations.forEach((c) => c.messages.sort((a, b) => a.createdAt - b.createdAt));
  return conversations.sort((a, b) => b.lastAt - a.lastAt);
}

function esc(value: string): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function timeLabel(timestamp: number): string {
  return new Date(timestamp).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function renderChatMessages(messages: Message[], userId: string): string {
  if (!messages.length) {
    return '<p class="chat-empty">No messages yet. Say hello and ask your question.</p>';
  }
  return messages
    .map(
      (m) => `
      <div class="chat-msg ${m.senderId === userId ? 'msg-sent' : 'msg-received'}">
        <div class="msg-bubble">${esc(m.body)}</div>
        <span class="msg-time">${timeLabel(m.createdAt)}</span>
      </div>`
    )
    .join('');
}

export function renderConversationList(conversations: Conversation[]): string {
  if (!conversations.length) {
    return '<p class="drawer-empty">No messages yet. Open a listing and choose "Message".</p>';
  }
  return conversations
    .map((c) => {
      const last = c.messages[c.messages.length - 1];
      return `
      <div class="drawer-item-card" data-conversation="${esc(c.key)}" role="button" tabindex="0">
        <div class="drawer-item-info">
          <div class="drawer-item-title">${esc(c.otherName)} · ${esc(c.itemTitle)}</div>
          <div class="drawer-item-meta"><span class="drawer-message-preview">${esc(last?.body || '')}</span><span>${last ? timeLabel(last.createdAt) : ''}</span></div>
        </div>
      </div>`;
    })
    .join('');
}
