/**
 * Message Entity — Representa uma mensagem do WhatsApp
 *
 * Responsável por extrair texto de diferentes formatos de mensagem
 * da Evolution API (conversation, extendedText, image caption, video caption).
 */

export interface RawWhatsAppMessage {
  conversation?: string;
  extendedTextMessage?: { text?: string };
  imageMessage?: { caption?: string };
  videoMessage?: { caption?: string };
}

export class Message {
  private constructor(
    public readonly id: string,
    public readonly text: string | null,
    public readonly timestamp: number | null,
    public readonly type: string | null,
  ) {}

  static fromEvolutionPayload(
    id: string,
    msg: RawWhatsAppMessage,
    timestamp: number | null,
    type: string | null,
  ): Message {
    const text = Message.extractText(msg);
    return new Message(id, text, timestamp, type);
  }

  /**
   * Extrai texto de qualquer formato de mensagem WhatsApp
   */
  private static extractText(msg: RawWhatsAppMessage): string | null {
    return (
      msg?.conversation ||
      msg?.extendedTextMessage?.text ||
      msg?.imageMessage?.caption ||
      msg?.videoMessage?.caption ||
      null
    );
  }

  get hasText(): boolean {
    return this.text !== null && this.text.trim().length > 0;
  }
}
