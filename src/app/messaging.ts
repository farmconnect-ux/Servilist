/** Member-to-member messages about a listing or buyer request. */
import { listingActions, requestActions } from '../domain/marketRules';
import { ChatTarget, buildConversations, conversationKey, renderChatMessages } from '../ui/chat';
import type { Message } from '../types';
import type { ServilistApp } from '../main';

export function conversations(app: ServilistApp) {
  return buildConversations(
    app.messages,
    app.authService.getCurrentUser().id,
    app.listings,
    app.requests
  );
}

/** Opens the chat with the owner of whatever the detail modal is showing. */
export function contactOwner(app: ServilistApp) {
  if (app.cloud && !app.cloud.requireUser('send a message')) return;
  const userId = app.authService.getCurrentUser().id;
  const listing = app.currentListingDetail;
  const request = app.currentRequestDetail;

  if (listing && listingActions(listing, userId).canMessage) {
    app.openChat({
      listingId: listing.id,
      itemTitle: listing.title,
      otherId: listing.seller.id,
      otherName: listing.seller.name,
    });
  } else if (request && requestActions(request, userId).canMessage) {
    app.openChat({
      requestId: request.id,
      itemTitle: request.title,
      otherId: request.buyer.id,
      otherName: request.buyer.name,
    });
  } else {
    app.showToast('This is your own post. Replies from other members appear in Messages.', 'info');
  }
}

export function openChat(app: ServilistApp, target: ChatTarget) {
  app.chatTarget = target;
  const name = document.getElementById('chatSellerName');
  const title = document.getElementById('chatItemTitle');
  if (name) name.textContent = target.otherName;
  if (title) title.textContent = target.itemTitle;
  app.renderChat();
  app.dialogs['chatModalOverlay']?.open();
  (document.getElementById('chatInput') as HTMLInputElement | null)?.focus();
}

export function renderChat(app: ServilistApp) {
  const target = app.chatTarget;
  const box = document.getElementById('chatMessages');
  if (!target || !box) return;

  const userId = app.authService.getCurrentUser().id;
  const key = conversationKey(target);
  const thread = conversations(app).find((c) => c.key === key);
  box.innerHTML = renderChatMessages(thread?.messages ?? [], userId);
  box.scrollTop = box.scrollHeight;
}

export function sendChat(app: ServilistApp, body: string) {
  const target = app.chatTarget;
  const text = body.trim();
  if (!target || !text) return;

  if (app.cloud) {
    void app.cloud.sendMessage(target, text);
    return;
  }

  // Demo mode keeps the conversation in this browser only
  const user = app.authService.getCurrentUser();
  const message: Message = {
    id: `msg-${Date.now()}`,
    listingId: target.listingId,
    requestId: target.requestId,
    senderId: user.id,
    recipientId: target.otherId,
    senderName: user.name,
    recipientName: target.otherName,
    body: text,
    createdAt: Date.now(),
  };
  app.messages = [...app.messages, message];
  app.renderChat();
  app.updateActivityBadges();
}
