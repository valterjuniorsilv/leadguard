/**
 * Use Case: Apply Client Config
 *
 * Garante que dados do lead (pushName, phone_e164, messageTimestamp) existam
 * no payload. Computa lead_date e lead_time no timezone do cliente.
 *
 * Corresponde ao Code node: "Code :: Apply Client Config"
 *
 * Input: Payload mergeado + dados do Normalize + Webhook (cross-node refs)
 * Output: Payload enriquecido com lead_date (YYYY-MM-DD) e lead_time (HH:MM)
 */

export interface ApplyConfigInput {
  timezone?: string;
  pushName?: string;
  messageTimestamp?: number | null;
  phone_e164?: string;
  [key: string]: unknown;
}

export interface ApplyConfigOutput extends ApplyConfigInput {
  lead_date: string; // YYYY-MM-DD
  lead_time: string; // HH:MM
}

export function applyClientConfig(
  input: ApplyConfigInput,
  normalizedData?: { pushName?: string; messageTimestamp?: number | null; phone_e164?: string },
  webhookData?: { pushName?: string; messageTimestamp?: number | null; phone_e164?: string },
): ApplyConfigOutput {
  const tz = input.timezone || 'America/Sao_Paulo';

  // Resolver pushName
  const pushName = normalizedData?.pushName || webhookData?.pushName || input.pushName || '';

  // Resolver messageTimestamp
  const messageTimestamp = normalizedData?.messageTimestamp || webhookData?.messageTimestamp || input.messageTimestamp || null;

  // Resolver phone_e164
  const rawPhone = normalizedData?.phone_e164 || webhookData?.phone_e164 || input.phone_e164 || '';
  const phone_e164 = String(rawPhone).replace(/@.+$/, '').replace(/[^\d]/g, '');

  // Computar data/hora do lead
  const { dateStr, timeStr } = messageTimestamp
    ? formatFromTimestamp(Number(messageTimestamp), tz)
    : formatNow(tz);

  return {
    ...input,
    pushName,
    messageTimestamp,
    phone_e164,
    lead_date: dateStr,
    lead_time: timeStr,
  };
}

function formatFromTimestamp(tsSeconds: number, tz: string): { dateStr: string; timeStr: string } {
  const d = new Date(tsSeconds * 1000);
  return {
    dateStr: new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d),
    timeStr: new Intl.DateTimeFormat('pt-BR', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false }).format(d),
  };
}

function formatNow(tz: string): { dateStr: string; timeStr: string } {
  const now = new Date();
  return {
    dateStr: new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now),
    timeStr: new Intl.DateTimeFormat('pt-BR', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false }).format(now),
  };
}
