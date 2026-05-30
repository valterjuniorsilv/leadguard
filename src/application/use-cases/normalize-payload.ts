/**
 * Use Case: Normalize Evolution Payload
 *
 * Transforma o payload bruto da Evolution API em contrato interno estável.
 * Suporta LID addressing (remoteJid @lid com telefone real em remoteJidAlt).
 *
 * Corresponde ao Code node: "Code :: Normalize Evolution Payload"
 *
 * Input: Raw webhook body da Evolution API
 * Output: Contrato normalizado com phone_e164, lead_key, message, flags
 */

import { PhoneNumber, isGroupJid, isPhoneJid } from '../../domain/value-objects/phone-number';
import { LeadKey } from '../../domain/value-objects/lead-key';
import { Message, type RawWhatsAppMessage } from '../../domain/entities/message';

export interface NormalizeInput {
  body: {
    event?: string;
    instance?: string;
    instanceName?: string;
    sender?: string;
    date_time?: string;
    data?: {
      key?: {
        id?: string;
        remoteJid?: string;
        remoteJidAlt?: string;
        senderPn?: string;
        fromMe?: boolean;
      };
      message?: RawWhatsAppMessage;
      messageTimestamp?: number;
      pushName?: string;
      messageType?: string;
      source?: string;
    };
  };
}

export interface NormalizedPayload {
  event: string | null;
  instance: string | null;
  lead_key: string;
  message_id: string | null;
  message_timestamp: number | null;
  remote_jid: string | null;
  contact_jid: string | null;
  phone_e164: string;
  phone_status: 'OK' | 'MISSING';
  message: string | null;
  fromMe: boolean;
  is_group: boolean;
  pushName: string | null;
  messageType: string | null;
  source: string | null;
}

export function normalizeEvolutionPayload(input: NormalizeInput): NormalizedPayload {
  const body = input.body ?? {};
  const data = body.data ?? {};
  const key = data.key ?? {};
  const msg = data.message ?? {};

  const event = body.event ?? null;
  const instance = body.instance ?? body.instanceName ?? null;
  const message_id = key.id ?? null;
  const message_timestamp = data.messageTimestamp ?? null;

  // Extrair texto da mensagem
  const messageEntity = Message.fromEvolutionPayload(
    message_id || '',
    msg,
    message_timestamp,
    data.messageType ?? null,
  );

  // Resolver contact_jid (prioridade: senderPn -> remoteJidAlt -> sender -> remoteJid)
  const senderPn = key.senderPn ?? null;
  const sender = body.sender ?? null;
  const remoteJid = key.remoteJid ?? null;
  const remoteJidAlt = key.remoteJidAlt ?? null;

  let contact_jid: string | null = null;

  if (senderPn && isPhoneJid(senderPn)) {
    contact_jid = senderPn;
  } else if (remoteJidAlt && isPhoneJid(remoteJidAlt)) {
    contact_jid = remoteJidAlt;
  } else if (sender && isPhoneJid(sender)) {
    contact_jid = sender;
  } else if (remoteJid && isPhoneJid(remoteJid) && !isGroupJid(remoteJid)) {
    contact_jid = remoteJid;
  } else {
    contact_jid = senderPn || remoteJidAlt || sender || remoteJid || null;
  }

  // Extrair telefone
  const phone = PhoneNumber.fromCandidates({ senderPn, remoteJidAlt, sender, remoteJid });

  // Lead key estável
  const leadKey = LeadKey.create(instance || undefined!, contact_jid);

  const fromMe = key.fromMe === true;
  const is_group = isGroupJid(remoteJid);

  return {
    event,
    instance,
    lead_key: leadKey.value,
    message_id,
    message_timestamp,
    remote_jid: remoteJid || null,
    contact_jid,
    phone_e164: phone.digits,
    phone_status: phone.status,
    message: messageEntity.text,
    fromMe,
    is_group,
    pushName: data.pushName ?? null,
    messageType: data.messageType ?? null,
    source: data.source ?? null,
  };
}
