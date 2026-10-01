import { Injectable, Logger } from '@nestjs/common';

export type LiveRealtimeMessageEvent = Readonly<{
  roomId: string;
  message: {
    id: string;
    roomId: string;
    type: string;
    content: string;
    giftPoints?: number | null;
    createdAt: Date | string;
    sender: {
      id: string;
      name: string;
      avatar: string | null;
    };
  };
}>;

export type LiveRealtimeViewerEvent = Readonly<{
  roomId: string;
  viewerCount: number;
}>;

export type LiveRealtimeEndEvent = Readonly<{
  roomId: string;
  reason?: string;
}>;

export type LiveRealtimeMessageListener = (
  event: LiveRealtimeMessageEvent,
) => void | Promise<void>;

export type LiveRealtimeViewerListener = (
  event: LiveRealtimeViewerEvent,
) => void | Promise<void>;

export type LiveRealtimeEndListener = (
  event: LiveRealtimeEndEvent,
) => void | Promise<void>;

@Injectable()
export class LiveRealtimePublisher {
  private readonly logger = new Logger(LiveRealtimePublisher.name);
  private readonly messageListeners = new Set<LiveRealtimeMessageListener>();
  private readonly viewerListeners = new Set<LiveRealtimeViewerListener>();
  private readonly endListeners = new Set<LiveRealtimeEndListener>();

  subscribeMessage(listener: LiveRealtimeMessageListener): () => void {
    this.messageListeners.add(listener);
    return () => {
      this.messageListeners.delete(listener);
    };
  }

  subscribeViewer(listener: LiveRealtimeViewerListener): () => void {
    this.viewerListeners.add(listener);
    return () => {
      this.viewerListeners.delete(listener);
    };
  }

  subscribeEnd(listener: LiveRealtimeEndListener): () => void {
    this.endListeners.add(listener);
    return () => {
      this.endListeners.delete(listener);
    };
  }

  publishMessage(event: LiveRealtimeMessageEvent): void {
    for (const listener of this.messageListeners) {
      try {
        const res = listener(event);
        Promise.resolve(res).catch((err) =>
          this.logger.warn(`Live message listener error: ${err}`),
        );
      } catch (err) {
        this.logger.warn(`Live message listener error: ${err}`);
      }
    }
  }

  publishViewer(event: LiveRealtimeViewerEvent): void {
    for (const listener of this.viewerListeners) {
      try {
        const res = listener(event);
        Promise.resolve(res).catch((err) =>
          this.logger.warn(`Live viewer listener error: ${err}`),
        );
      } catch (err) {
        this.logger.warn(`Live viewer listener error: ${err}`);
      }
    }
  }

  publishEnd(event: LiveRealtimeEndEvent): void {
    for (const listener of this.endListeners) {
      try {
        const res = listener(event);
        Promise.resolve(res).catch((err) =>
          this.logger.warn(`Live end listener error: ${err}`),
        );
      } catch (err) {
        this.logger.warn(`Live end listener error: ${err}`);
      }
    }
  }
}
