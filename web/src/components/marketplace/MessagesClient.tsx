"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ConversationItem {
  otherUser: {
    id: string;
    username: string;
    displayName: string;
    rating: number;
    reviewsCount: number;
    verified: boolean;
  };
  lastMessage: {
    id: string;
    senderId: string;
    recipientId: string;
    listingId?: string | null;
    requestId?: string | null;
    body: string;
    createdAt: string;
  };
  listingId?: string | null;
  requestId?: string | null;
  listingTitle?: string;
  requestTitle?: string;
  unreadCount: number;
}

interface MessageItem {
  id: string;
  senderId: string;
  recipientId: string;
  listingId?: string | null;
  requestId?: string | null;
  body: string;
  createdAt: string;
}

export function MessagesClient({
  currentUserId,
  conversations: initialConversations,
}: {
  currentUserId: string;
  conversations: ConversationItem[];
}) {
  const [conversations] = useState<ConversationItem[]>(initialConversations);
  const [selectedConvo, setSelectedConvo] = useState<ConversationItem | null>(
    initialConversations[0] || null,
  );
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);

  const loadMessages = async (convo: ConversationItem) => {
    setSelectedConvo(convo);
    setLoadingMessages(true);
    try {
      let url = `/api/v1/conversations/${convo.otherUser.id}/messages`;
      const params = new URLSearchParams();
      if (convo.listingId) params.append("listingId", convo.listingId);
      if (convo.requestId) params.append("requestId", convo.requestId);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url);
      const json = await res.json();
      if (json.success && json.data) {
        setMessages(json.data);
      }
    } catch {
      // silently handle or show error
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConvo || !replyText.trim() || sending) return;

    setSending(true);
    try {
      const payload = {
        recipientId: selectedConvo.otherUser.id,
        listingId: selectedConvo.listingId || undefined,
        requestId: selectedConvo.requestId || undefined,
        body: replyText.trim(),
      };

      const res = await fetch("/api/v1/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success && json.data) {
        setMessages((prev) => [...prev, json.data]);
        setReplyText("");
      }
    } catch {
      // handle error
    } finally {
      setSending(false);
    }
  };

  if (conversations.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="font-semibold text-ink">No conversations yet.</p>
        <p className="mt-1 text-xs text-muted">
          When you negotiate offers, receive quotes, or inquire about listings, your messages will appear here.
        </p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 overflow-hidden rounded-xl border bg-white md:grid-cols-3">
      {/* Sidebar List */}
      <div className="border-r border-border md:col-span-1">
        <div className="border-b p-3 bg-gray-50 text-xs font-bold text-muted uppercase">
          Conversations ({conversations.length})
        </div>
        <div className="max-h-[500px] divide-y overflow-y-auto">
          {conversations.map((c, i) => {
            const isSelected = selectedConvo?.otherUser.id === c.otherUser.id;
            return (
              <button
                type="button"
                key={i}
                onClick={() => loadMessages(c)}
                className={`w-full p-3 text-left transition hover:bg-gray-50 ${
                  isSelected ? "bg-brand/5 border-l-4 border-brand" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-ink text-sm">
                    {c.otherUser.displayName}
                  </span>
                  <span className="text-[10px] text-muted">
                    {new Date(c.lastMessage.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                {(c.listingTitle || c.requestTitle) && (
                  <p className="mt-0.5 text-xs font-medium text-brand truncate">
                    Re: {c.listingTitle || c.requestTitle}
                  </p>
                )}
                <p className="mt-1 text-xs text-muted truncate">{c.lastMessage.body}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat Thread */}
      <div className="flex flex-col justify-between md:col-span-2">
        {selectedConvo ? (
          <>
            {/* Header */}
            <div className="border-b p-4 bg-gray-50 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-ink text-sm">
                  {selectedConvo.otherUser.displayName}
                </h4>
                {(selectedConvo.listingTitle || selectedConvo.requestTitle) && (
                  <p className="text-xs text-muted">
                    Regarding:{" "}
                    <span className="font-semibold text-ink">
                      {selectedConvo.listingTitle || selectedConvo.requestTitle}
                    </span>
                  </p>
                )}
              </div>
              <span className="text-xs text-muted">★ {selectedConvo.otherUser.rating.toFixed(1)}</span>
            </div>

            {/* Message Area */}
            <div className="flex-1 space-y-3 p-4 max-h-[380px] overflow-y-auto">
              {loadingMessages ? (
                <div className="py-8 text-center text-xs text-muted">Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted">
                  No prior messages in this conversation.
                </div>
              ) : (
                messages.map((m) => {
                  const isMe = m.senderId === currentUserId;
                  return (
                    <div
                      key={m.id}
                      className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                          isMe
                            ? "bg-brand text-white rounded-br-none"
                            : "bg-gray-100 text-ink rounded-bl-none"
                        }`}
                      >
                        <p>{m.body}</p>
                        <span
                          className={`mt-1 block text-[10px] ${
                            isMe ? "text-white/70 text-right" : "text-muted"
                          }`}
                        >
                          {new Date(m.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="border-t p-3 bg-white flex gap-2">
              <input
                type="text"
                placeholder="Type a secure message..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="flex-1 rounded-lg border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none"
              />
              <Button type="submit" className="min-h-9 px-3 text-xs" disabled={sending || !replyText.trim()}>
                {sending ? "..." : "Send"}
              </Button>
            </form>
          </>
        ) : (
          <div className="flex h-full items-center justify-center p-8 text-xs text-muted">
            Select a conversation on the left to start chatting.
          </div>
        )}
      </div>
    </div>
  );
}
