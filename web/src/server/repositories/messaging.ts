import "server-only";
import type { Db } from "@/lib/db/server";
import { type PublicProfile } from "./marketplace";

const PUBLIC_PROFILE = "id, username, display_name, rating, reviews_count, is_verified, avatar_url, city, country";

export interface MessageRecord {
  id: string;
  senderId: string;
  recipientId: string;
  listingId?: string | null;
  requestId?: string | null;
  body: string;
  createdAt: string;
  sender?: PublicProfile;
  recipient?: PublicProfile;
}

export interface ConversationSummary {
  otherUser: PublicProfile;
  lastMessage: MessageRecord;
  listingId?: string | null;
  requestId?: string | null;
  listingTitle?: string;
  listingSlug?: string;
  requestTitle?: string;
  unreadCount: number;
}

export async function sendMessage(
  db: Db,
  params: {
    senderId: string;
    recipientId: string;
    listingId?: string;
    requestId?: string;
    body: string;
  },
): Promise<MessageRecord> {
  const { data, error } = await db
    .from("messages")
    .insert({
      sender_id: params.senderId,
      recipient_id: params.recipientId,
      listing_id: params.listingId || null,
      request_id: params.requestId || null,
      body: params.body,
    })
    .select(`
      *,
      sender:profiles!sender_id(${PUBLIC_PROFILE}),
      recipient:profiles!recipient_id(${PUBLIC_PROFILE})
    `)
    .single();

  if (error) {
    throw new Error(`Failed to send message: ${error.message}`);
  }

  const sender = Array.isArray(data.sender) ? data.sender[0] : data.sender;
  const recipient = Array.isArray(data.recipient) ? data.recipient[0] : data.recipient;

  return {
    id: data.id,
    senderId: data.sender_id,
    recipientId: data.recipient_id,
    listingId: data.listing_id,
    requestId: data.request_id,
    body: data.body,
    createdAt: data.created_at,
    sender: sender ? {
      id: sender.id,
      username: sender.username,
      displayName: sender.display_name,
      rating: Number(sender.rating || 5.0),
      reviewsCount: Number(sender.reviews_count || 0),
      verified: Boolean(sender.is_verified),
    } : undefined,
    recipient: recipient ? {
      id: recipient.id,
      username: recipient.username,
      displayName: recipient.display_name,
      rating: Number(recipient.rating || 5.0),
      reviewsCount: Number(recipient.reviews_count || 0),
      verified: Boolean(recipient.is_verified),
    } : undefined,
  };
}

export async function getConversationMessages(
  db: Db,
  params: {
    userId: string;
    otherUserId: string;
    listingId?: string;
    requestId?: string;
    limit?: number;
  },
): Promise<MessageRecord[]> {
  let query = db
    .from("messages")
    .select(`
      *,
      sender:profiles!sender_id(${PUBLIC_PROFILE}),
      recipient:profiles!recipient_id(${PUBLIC_PROFILE})
    `)
    .or(
      `and(sender_id.eq.${params.userId},recipient_id.eq.${params.otherUserId}),and(sender_id.eq.${params.otherUserId},recipient_id.eq.${params.userId})`
    )
    .order("created_at", { ascending: true })
    .limit(params.limit || 50);

  if (params.listingId) {
    query = query.eq("listing_id", params.listingId);
  }
  if (params.requestId) {
    query = query.eq("request_id", params.requestId);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Could not load messages: ${error.message}`);

  return (data || []).map((row: any) => {
    const sender = Array.isArray(row.sender) ? row.sender[0] : row.sender;
    const recipient = Array.isArray(row.recipient) ? row.recipient[0] : row.recipient;
    return {
      id: row.id,
      senderId: row.sender_id,
      recipientId: row.recipient_id,
      listingId: row.listing_id,
      requestId: row.request_id,
      body: row.body,
      createdAt: row.created_at,
      sender: sender ? {
        id: sender.id,
        username: sender.username,
        displayName: sender.display_name,
        rating: Number(sender.rating || 5.0),
        reviewsCount: Number(sender.reviews_count || 0),
        verified: Boolean(sender.is_verified),
      } : undefined,
      recipient: recipient ? {
        id: recipient.id,
        username: recipient.username,
        displayName: recipient.display_name,
        rating: Number(recipient.rating || 5.0),
        reviewsCount: Number(recipient.reviews_count || 0),
        verified: Boolean(recipient.is_verified),
      } : undefined,
    };
  });
}

export async function listUserConversations(
  db: Db,
  userId: string,
): Promise<ConversationSummary[]> {
  // Fetch recent messages involving this user
  const { data, error } = await db
    .from("messages")
    .select(`
      *,
      sender:profiles!sender_id(${PUBLIC_PROFILE}),
      recipient:profiles!recipient_id(${PUBLIC_PROFILE}),
      listing:listings!listing_id(title, slug),
      request:buyer_requests!request_id(title)
    `)
    .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw new Error(`Could not load conversations: ${error.message}`);

  // Deduplicate conversations by partner + (listingId or requestId)
  const map = new Map<string, ConversationSummary>();

  for (const row of data || []) {
    const isSender = row.sender_id === userId;
    const otherUserRaw = isSender ? row.recipient : row.sender;
    const other = Array.isArray(otherUserRaw) ? otherUserRaw[0] : otherUserRaw;
    if (!other) continue;

    const key = `${other.id}_${row.listing_id || ""}_${row.request_id || ""}`;
    if (!map.has(key)) {
      const listing = Array.isArray(row.listing) ? row.listing[0] : row.listing;
      const request = Array.isArray(row.request) ? row.request[0] : row.request;

      map.set(key, {
        otherUser: {
          id: other.id,
          username: other.username,
          displayName: other.display_name || "User",
          rating: Number(other.rating || 5.0),
          reviewsCount: Number(other.reviews_count || 0),
          verified: Boolean(other.is_verified),
        },
        lastMessage: {
          id: row.id,
          senderId: row.sender_id,
          recipientId: row.recipient_id,
          listingId: row.listing_id,
          requestId: row.request_id,
          body: row.body,
          createdAt: row.created_at,
        },
        listingId: row.listing_id,
        requestId: row.request_id,
        listingTitle: listing?.title,
        listingSlug: listing?.slug,
        requestTitle: request?.title,
        unreadCount: 0,
      });
    }
  }

  return Array.from(map.values());
}
