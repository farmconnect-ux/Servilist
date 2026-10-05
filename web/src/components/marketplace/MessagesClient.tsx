"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";
import { Button, buttonClass } from "@/components/ui/button";
import { EmptyState, Skeleton, VerifiedBadge } from "@/components/ui/card";
import { Alert, Textarea } from "@/components/ui/form";
import { cn } from "@/lib/utils";

/**
 * Messages (docs/UI_UX_SPEC.md section 46): conversations beside the chat on
 * desktop, one at a time on phones. Every conversation shows what it is about,
 * because every message on Servilist is tied to a listing or a request.
 */

interface ConversationItem {
  otherUser: { id: string; displayName: string; verified: boolean };
  lastMessage: { senderId: string; body: string; createdAt: string };
  listingId?: string | null;
  requestId?: string | null;
  listingTitle?: string;
  listingSlug?: string;
  requestTitle?: string;
}

interface MessageItem {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
}

function keyOf(conversation: ConversationItem): string {
  return `${conversation.otherUser.id}:${conversation.listingId ?? ""}:${conversation.requestId ?? ""}`;
}

function time(value: string): string {
  return new Date(value).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

export function MessagesClient({
  currentUserId,
  conversations,
}: {
  currentUserId: string;
  conversations: ConversationItem[];
}) {
  const [selected, setSelected] = useState<ConversationItem | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const end = useRef<HTMLDivElement>(null);

  const load = useCallback(async (conversation: ConversationItem) => {
    setLoading(true);
    setLoadError(null);
    setMessages([]);
    const params = new URLSearchParams();
    if (conversation.listingId) params.set("listingId", conversation.listingId);
    if (conversation.requestId) params.set("requestId", conversation.requestId);
    try {
      const res = await fetch(`/api/v1/conversations/${conversation.otherUser.id}/messages?${params}`);
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) throw new Error();
      setMessages(json.data);
    } catch {
      setLoadError("We couldn't load this conversation. Please try again.");
    }
    setLoading(false);
  }, []);

  // On desktop the first conversation opens straight away; on phones the list shows first
  useEffect(() => {
    const first = conversations[0];
    if (first && window.matchMedia("(min-width: 768px)").matches) {
      setSelected(first);
      void load(first);
    }
  }, [conversations, load]);

  useEffect(() => {
    end.current?.scrollIntoView({ block: "nearest" });
  }, [messages]);

  function open(conversation: ConversationItem) {
    setSelected(conversation);
    setSendError(null);
    void load(conversation);
  }

  async function send(event: React.FormEvent) {
    event.preventDefault();
    const body = reply.trim();
    if (!selected || !body || sending) return;
    setSending(true);
    setSendError(null);
    try {
      const res = await fetch("/api/v1/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId: selected.otherUser.id,
          listingId: selected.listingId || undefined,
          requestId: selected.requestId || undefined,
          body,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(json?.error?.message || "Your message was not sent. Please try again.");
      }
      setMessages((current) => [...current, json.data]);
      setReply("");
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Your message was not sent.");
    }
    setSending(false);
  }

  if (conversations.length === 0) {
    return (
      <EmptyState
        title="No messages yet"
        action={
          <Link href="/search" className={buttonClass("primary")}>
            Browse listings
          </Link>
        }
      >
        Message a seller from a listing, or a buyer from their request, and the conversation
        appears here.
      </EmptyState>
    );
  }

  const subject = selected?.listingTitle || selected?.requestTitle;
  const subjectHref = selected?.listingSlug
    ? `/products/${selected.listingSlug}`
    : selected?.requestId
      ? `/requests/${selected.requestId}`
      : null;

  return (
    <div className="grid overflow-hidden rounded-card border border-line bg-surface md:h-[36rem] md:grid-cols-[280px_1fr]">
      {/* Conversations */}
      <nav
        aria-label="Conversations"
        className={cn("overflow-y-auto border-line md:border-r", selected ? "hidden md:block" : "block")}
      >
        <ul>
          {conversations.map((conversation) => {
            const active = selected !== null && keyOf(selected) === keyOf(conversation);
            return (
              <li key={keyOf(conversation)} className="border-b border-line last:border-b-0">
                <button
                  type="button"
                  onClick={() => open(conversation)}
                  aria-current={active ? "true" : undefined}
                  className={cn(
                    "flex min-h-16 w-full flex-col gap-0.5 px-4 py-3 text-left transition-colors",
                    active ? "bg-primary-50" : "hover:bg-surface-muted",
                  )}
                >
                  <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                    <span className="truncate">{conversation.otherUser.displayName}</span>
                    {conversation.otherUser.verified ? <VerifiedBadge text="" /> : null}
                  </span>
                  <span className="truncate text-xs text-primary-700">
                    {conversation.listingTitle || conversation.requestTitle || "Item no longer listed"}
                  </span>
                  <span className="truncate text-xs text-muted">
                    {conversation.lastMessage.senderId === currentUserId ? "You: " : ""}
                    {conversation.lastMessage.body}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Chat */}
      <section
        aria-label="Conversation"
        className={cn("min-h-[28rem] flex-col md:flex md:min-h-0", selected ? "flex" : "hidden")}
      >
        {selected ? (
          <>
            <header className="flex items-center gap-2 border-b border-line p-3">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="flex size-11 items-center justify-center rounded-input text-ink-soft hover:bg-surface-muted md:hidden"
                aria-label="Back to conversations"
              >
                <ArrowLeft className="size-5" aria-hidden="true" />
              </button>
              <p className="flex items-center gap-2 text-base font-semibold text-ink">
                {selected.otherUser.displayName}
                {selected.otherUser.verified ? <VerifiedBadge /> : null}
              </p>
            </header>

            {/* What this conversation is about */}
            <div className="flex items-center justify-between gap-3 border-b border-line bg-surface-muted px-4 py-3">
              <div className="min-w-0">
                <p className="text-xs text-muted">You&apos;re discussing</p>
                <p className="truncate text-sm font-semibold text-ink">
                  {subject || "An item that is no longer listed"}
                </p>
              </div>
              {subjectHref ? (
                <Link href={subjectHref} className={buttonClass("secondary", "sm")}>
                  {selected.listingSlug ? "View listing" : "View request"}
                </Link>
              ) : null}
            </div>

            <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4" aria-live="polite">
              {loading ? (
                <>
                  <Skeleton className="h-10 w-2/3" />
                  <Skeleton className="ml-auto h-10 w-1/2" />
                  <Skeleton className="h-10 w-3/5" />
                </>
              ) : loadError ? (
                <div className="flex flex-col items-start gap-3">
                  <Alert tone="danger">{loadError}</Alert>
                  <Button variant="secondary" onClick={() => load(selected)}>
                    Try again
                  </Button>
                </div>
              ) : (
                messages.map((message) => {
                  const mine = message.senderId === currentUserId;
                  return (
                    <div key={message.id} className={cn("flex flex-col gap-1", mine ? "items-end" : "items-start")}>
                      <p
                        className={cn(
                          "max-w-[85%] rounded-card px-3 py-2 text-sm whitespace-pre-line",
                          mine ? "bg-primary-600 text-white" : "bg-surface-muted text-ink",
                        )}
                      >
                        {message.body}
                      </p>
                      <span className="text-xs text-muted">
                        {mine ? "You" : selected.otherUser.displayName} · {time(message.createdAt)}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={end} />
            </div>

            <form onSubmit={send} className="flex flex-col gap-2 border-t border-line p-3">
              {sendError ? <Alert tone="danger">{sendError}</Alert> : null}
              <div className="flex items-end gap-2">
                <label htmlFor="message-reply" className="sr-only">
                  Your message
                </label>
                <Textarea
                  id="message-reply"
                  rows={1}
                  maxLength={2000}
                  value={reply}
                  onChange={(event) => setReply(event.target.value)}
                  placeholder="Type a message..."
                  className="min-h-11"
                />
                <Button type="submit" disabled={sending || !reply.trim()} aria-busy={sending}>
                  <Send className="size-4" aria-hidden="true" />
                  Send
                </Button>
              </div>
            </form>
          </>
        ) : (
          <p className="m-auto hidden p-6 text-sm text-muted md:block">Choose a conversation.</p>
        )}
      </section>
    </div>
  );
}
