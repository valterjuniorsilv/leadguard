/**
 * Use Case: Extract Dedup Fields
 *
 * Extrai campos mínimos para deduplicação no PostgreSQL.
 * Preserva o payload bruto completo como source of truth.
 *
 * Corresponde ao Code node: "Code :: Extract Dedup Fields"
 *
 * Input: Lead context ou raw webhook
 * Output: { instance, message_id, remote_jid, webhook_body }
 */

export interface DedupFields {
  instance: string;
  message_id: string;
  remote_jid: string;
  webhook_body: Record<string, unknown>;
}

export function extractDedupFields(input: Record<string, unknown>): DedupFields {
  const body = (input.body ?? input) as Record<string, unknown>;

  const instance = str(pick(body, ['instance']));
  const remote_jid = str(pick(body, ['data.key.remoteJid']));
  const message_id = str(pick(body, ['data.key.id']));

  return {
    instance,
    message_id,
    remote_jid,
    webhook_body: body,
  };
}

// Helpers
function str(v: unknown): string {
  if (v === undefined || v === null) return '';
  return String(v).trim();
}

function pick(obj: Record<string, unknown>, paths: string[], fallback?: unknown): unknown {
  for (const p of paths) {
    try {
      const val = p.split('.').reduce(
        (acc: any, k: string) => (acc && acc[k] !== undefined ? acc[k] : undefined),
        obj,
      );
      if (val !== undefined && val !== null) return val;
    } catch (_) {}
  }
  return fallback;
}
