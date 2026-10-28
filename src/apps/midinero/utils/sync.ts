// Real-time synchronization utility using BroadcastChannel and LocalStorage
const SYNC_CHANNEL = 'midinero_realtime_sync';

export type SyncEventType = 'DATA_UPDATED' | 'SETTINGS_UPDATED';

export interface SyncMessage {
  type: SyncEventType;
  timestamp: number;
  payload?: unknown;
}

class RealtimeSyncManager {
  private channel: BroadcastChannel | null = null;
  private listeners: Array<(msg: SyncMessage) => void> = [];

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.channel = new BroadcastChannel(SYNC_CHANNEL);
      this.channel.onmessage = (event) => {
        this.notifyListeners(event.data);
      };
    }

    // Also listen to window storage event for cross-tab fallback
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key?.startsWith('midinero_')) {
          this.notifyListeners({
            type: 'DATA_UPDATED',
            timestamp: Date.now(),
          });
        }
      });
    }
  }

  public notifyUpdate(type: SyncEventType = 'DATA_UPDATED', payload?: unknown) {
    const msg: SyncMessage = {
      type,
      timestamp: Date.now(),
      payload,
    };

    if (this.channel) {
      try {
        this.channel.postMessage(msg);
      } catch (err) {
        console.warn('BroadcastChannel error:', err);
      }
    }
  }

  public subscribe(callback: (msg: SyncMessage) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  private notifyListeners(msg: SyncMessage) {
    this.listeners.forEach((cb) => cb(msg));
  }
}

export const syncManager = new RealtimeSyncManager();
