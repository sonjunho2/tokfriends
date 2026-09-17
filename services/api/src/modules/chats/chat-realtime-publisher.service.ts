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

@Injectable()
export class ChatRealtimePublisher {
  private readonly logger = new Logger(ChatRealtimePublisher.name);
  private readonly listeners = new Set<ChatRealtimeListener>();

  subscribe(listener: ChatRealtimeListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
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

  private logFailure(error: unknown): void {
    if (error instanceof Error) {
      this.logger.error("Chat realtime listener failed", error.stack);
      return;
    }
    this.logger.error("Chat realtime listener failed", String(error));
  }
}
