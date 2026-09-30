import { Injectable, Logger } from "@nestjs/common";

export type ChatRealtimeMessage = Readonly<{
  id: string;
  chatId: string;
  senderAccountId: string;
  type: string;
  content: string;
  translatedContent: string | null;
  createdAt: Date;
}>;

export type ChatRealtimeListener = (
  message: ChatRealtimeMessage,
) => void | Promise<void>;

export type ChatRealtimeReadEvent = Readonly<{
  chatId: string;
  readerAccountId: string;
  readAt: Date;
}>;

export type ChatRealtimeReadListener = (
  event: ChatRealtimeReadEvent,
) => void | Promise<void>;

@Injectable()
export class ChatRealtimePublisher {
  private readonly logger = new Logger(ChatRealtimePublisher.name);
  private readonly listeners = new Set<ChatRealtimeListener>();
  private readonly readListeners = new Set<ChatRealtimeReadListener>();

  subscribe(listener: ChatRealtimeListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  subscribeRead(listener: ChatRealtimeReadListener): () => void {
    this.readListeners.add(listener);
    return () => {
      this.readListeners.delete(listener);
    };
  }

  publish(message: ChatRealtimeMessage): void {
    let payload: ChatRealtimeMessage;
    try {
      payload = Object.freeze({ ...message });
    } catch (error) {
      this.logFailure(error);
      return;
    }

    for (const listener of this.listeners) {
      try {
        const result = listener(payload);
        Promise.resolve(result).catch((error: unknown) => {
          this.logFailure(error);
        });
      } catch (error) {
        this.logFailure(error);
      }
    }
  }

  publishRead(event: ChatRealtimeReadEvent): void {
    let payload: ChatRealtimeReadEvent;
    try {
      payload = Object.freeze({ ...event });
    } catch (error) {
      this.logFailure(error);
      return;
    }

    for (const listener of this.readListeners) {
      try {
        const result = listener(payload);
        Promise.resolve(result).catch((error: unknown) => {
          this.logFailure(error);
        });
      } catch (error) {
        this.logFailure(error);
      }
    }
  }

  private logFailure(error: unknown): void {
    if (error instanceof Error) {
      this.logger.error("Chat realtime listener failed", error.stack);
      return;
    }
    this.logger.error("Chat realtime listener failed", String(error));
  }
}
