import { Listing } from '../types';

export type SyncEventType =
  | 'LISTING_CREATED'
  | 'LISTING_UPDATED'
  | 'REQUEST_CREATED'
  | 'REQUEST_UPDATED'
  | 'BID_PLACED'
  | 'QUOTE_PLACED'
  | 'USER_SWITCHED';

export interface SyncMessage {
  type: SyncEventType;
  payload: any;
  senderId?: string;
  timestamp: number;
}

export type SyncEventHandler = (message: SyncMessage) => void;

/**
 * Cross-context and Realtime Synchronization Manager.
 * Supports:
 * 1. BroadcastChannel API (cross-tab / cross-context zero-latency sync)
 * 2. Window storage events (fallback across contexts)
 * 3. Supabase Realtime Channels (PostgreSQL cloud / local instance sync)
 */
export class SyncChannelManager {
  private channel: BroadcastChannel | null = null;
  private eventSource: EventSource | null = null;
  private handlers: Set<SyncEventHandler> = new Set();
  private supabaseSubscription: any = null;

  constructor(channelName = 'servilist_marketplace_sync') {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel(channelName);
        this.channel.onmessage = (event) => {
          if (event.data) {
            this.notifyHandlers(event.data);
          }
        };
      } catch (e) {
        console.warn('BroadcastChannel initialization error:', e);
      }
    }

    if (typeof window !== 'undefined' && 'EventSource' in window) {
      try {
        this.eventSource = new EventSource('/api/events');
        this.eventSource.onmessage = (event) => {
          if (event.data) {
            try {
              const data = JSON.parse(event.data);
              if (data && data.type && data.type !== 'CONNECTED') {
                this.notifyHandlers(data);
              }
            } catch {
              // Ignore
            }
          }
        };
      } catch (e) {
        console.warn('EventSource initialization error:', e);
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event) => {
        if (event.key === 'servilist_sync_event' && event.newValue) {
          try {
            const data: SyncMessage = JSON.parse(event.newValue);
            this.notifyHandlers(data);
          } catch {
            // Ignore parse errors
          }
        }
      });
    }
  }

  public subscribe(handler: SyncEventHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  public broadcast(type: SyncEventType, payload: any, senderId?: string): void {
    const message: SyncMessage = {
      type,
      payload,
      senderId,
      timestamp: Date.now(),
    };

    // 1. BroadcastChannel
    if (this.channel) {
      try {
        this.channel.postMessage(message);
      } catch (err) {
        console.warn('BroadcastChannel post error:', err);
      }
    }

    // 2. Storage Event (for cross-context triggering)
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem('servilist_sync_event', JSON.stringify(message));
      } catch {
        // Quota
      }
    }

    // 3. HTTP Server Event Broadcast (cross-context & cross-browser synchronization)
    if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
      fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
      }).catch(() => {
        // Fallback in test/offline
      });
    }
  }

  public initSupabaseRealtime(
    supabaseClient: any,
    onListingInsert?: (listing: Listing) => void
  ): void {
    if (!supabaseClient || typeof supabaseClient.channel !== 'function') return;

    try {
      const channel = supabaseClient.channel('servilist-listings-sync');
      channel
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'listings' },
          (payload: any) => {
            if (payload.new && onListingInsert) {
              onListingInsert(payload.new as Listing);
            }
          }
        )
        .subscribe();

      this.supabaseSubscription = channel;
    } catch (e) {
      console.warn('Supabase Realtime subscription error:', e);
    }
  }

  public close(): void {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    if (this.supabaseSubscription && this.supabaseSubscription.unsubscribe) {
      this.supabaseSubscription.unsubscribe();
    }
    this.handlers.clear();
  }

  private notifyHandlers(message: SyncMessage): void {
    for (const h of this.handlers) {
      try {
        h(message);
      } catch (err) {
        console.error('Sync handler error:', err);
      }
    }
  }
}
