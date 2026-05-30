/**
 * Infrastructure: Evolution API Types
 *
 * Tipos TypeScript para o payload de webhook da Evolution API.
 * Documenta a estrutura completa incluindo LID addressing.
 */

/**
 * Payload raiz do webhook Evolution API (evento MESSAGES_UPSERT)
 */
export interface EvolutionWebhookPayload {
  event: string;
  instance: string;
  instanceName?: string;
  sender?: string;
  date_time?: string;
  data: EvolutionMessageData;
}

export interface EvolutionMessageData {
  key: EvolutionMessageKey;
  message?: EvolutionMessage;
  messageTimestamp?: number;
  pushName?: string;
  messageType?: string;
  source?: string;
}

export interface EvolutionMessageKey {
  id: string;
  fromMe: boolean;
  remoteJid: string;

  /**
   * LID Addressing: quando remoteJid é @lid,
   * o telefone real do contato vem aqui como @s.whatsapp.net
   */
  remoteJidAlt?: string;

  /**
   * Número do remetente quando disponível
   */
  senderPn?: string;
}

export interface EvolutionMessage {
  conversation?: string;
  extendedTextMessage?: {
    text?: string;
  };
  imageMessage?: {
    caption?: string;
  };
  videoMessage?: {
    caption?: string;
  };
}

/**
 * Formato do webhook n8n (envelope com body)
 */
export interface N8nWebhookInput {
  headers?: Record<string, string>;
  params?: Record<string, string>;
  query?: Record<string, string>;
  body: EvolutionWebhookPayload;
  webhookUrl?: string;
}
