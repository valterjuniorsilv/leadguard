/**
 * Use Case: Build Lead Context (Envelope)
 *
 * Monta envelope rico do lead com dados de contato, telefone validado,
 * nomes para exibição. Segunda camada de normalização.
 *
 * Corresponde ao Code node: "Code :: Lead Context (Envelope)"
 *
 * Input: Payload normalizado ou raw webhook
 * Output: Envelope completo do lead para downstream
 */

import { PhoneNumber, isPhoneJid } from '../../domain/value-objects/phone-number';

export interface LeadContextInput {
  instance?: string;
  event?: string;
  remoteJid?: string;
  remote_jid?: string;
  remoteJidAlt?: string;
  messageId?: string;
  message_id?: string;
  fromMe?: boolean;
  pushName?: string;
  phone_e164?: string;
  phone_status?: string;
  phone_reason?: string;
  lead_key?: string;
  lead_name?: string;
  item_name?: string;
  contact_name?: string;
  message?: string;
  messageTimestamp?: number | null;
  body?: Record<string, unknown>;
}

export interface LeadContext {
  event: string;
  instance: string;
  remoteJid: string;
  remoteJidAlt: string;
  messageId: string;
  fromMe: boolean;
  pushName: string;
  contact_name: string;
  phone_e164: string | null;
  phone_status: 'VALIDO' | 'INVALIDO';
  phone_reason: string | null;
  lead_key: string;
  lead_name: string;
  item_name: string;
  message: string;
  messageTimestamp: number | null;
  raw_body: Record<string, unknown> | null;
}

export function buildLeadContext(input: LeadContextInput): LeadContext {
  const body = input.body ?? null;
  const data = (body as any)?.data ?? null;
  const key = data?.key ?? null;

  const instance = str(body?.instance as string) || str(input.instance);
  const event = str(body?.event as string) || str(input.event);

  const remoteJid = str(key?.remoteJid) || str(input.remoteJid) || str(input.remote_jid);
  const remoteJidAlt = str(key?.remoteJidAlt) || str(input.remoteJidAlt) || '';
  const messageId = str(key?.id) || str(input.messageId) || str(input.message_id);
  const fromMe = key ? toBool(key.fromMe) : toBool(input.fromMe);

  const pushName = str(data?.pushName) || str(input.pushName);

  // Telefone: prioriza remoteJidAlt (LID fix)
  let phoneJid = '';
  if (remoteJidAlt && isPhoneJid(remoteJidAlt)) {
    phoneJid = remoteJidAlt;
  } else if (remoteJid && isPhoneJid(remoteJid)) {
    phoneJid = remoteJid;
  }

  const phoneDigits = phoneJid ? digits(phoneJid.split('@')[0]) : '';
  const phone_e164 = phoneDigits ? `+${phoneDigits}` : (str(input.phone_e164) || null);

  const phone_status = str(input.phone_status) || (phone_e164 ? 'VALIDO' : 'INVALIDO');
  const phone_reason = str(input.phone_reason) || (phone_e164 ? null : 'VAZIO');

  const contact_name = str(input.contact_name) || pushName || (phone_e164 ? `Contato ${phone_e164}` : 'Contato desconhecido');
  const lead_key = str(input.lead_key) || (instance && phone_e164 ? `${instance}::${phone_e164}` : `${instance}::(sem_tel)`);
  const item_name = str(input.item_name) || (phone_e164 ? `${contact_name} (${phone_e164})` : contact_name);
  const lead_name = str(input.lead_name) || contact_name;

  const message = str(input.message) || str(data?.message?.conversation) || str(data?.message?.extendedTextMessage?.text) || '';
  const messageTimestamp = input.messageTimestamp ?? data?.messageTimestamp ?? null;

  return {
    event,
    instance,
    remoteJid,
    remoteJidAlt,
    messageId,
    fromMe,
    pushName,
    contact_name,
    phone_e164,
    phone_status: phone_status as 'VALIDO' | 'INVALIDO',
    phone_reason,
    lead_key,
    lead_name,
    item_name,
    message,
    messageTimestamp,
    raw_body: body as Record<string, unknown> | null,
  };
}

// Helpers
function str(v: unknown): string {
  return v === undefined || v === null ? '' : String(v).trim();
}

function digits(v: string): string {
  return str(v).replace(/[^\d]/g, '');
}

function toBool(v: unknown): boolean {
  return v === true || v === 'true' || v === 1 || v === '1';
}
