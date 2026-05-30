/**
 * Use Case: Build Monday Update GQL
 *
 * Gera mutation GraphQL para atualizar item existente no Monday.com.
 * Atualiza telefone, data, hora, canal e status.
 *
 * Corresponde ao Code node: "Code :: Build Monday Update GQL"
 *
 * Input: column_map, board_id, item_id, timezone, dados do contato
 * Output: query GraphQL pronta para execução
 */

import type { ColumnMapData } from '../../domain/value-objects/column-map';

export interface UpdateMutationInput {
  column_map?: Partial<ColumnMapData>;
  monday_board_id?: number;
  board_id?: number;
  monday_item_id?: number;
  item_id?: number;
  timezone?: string;
  phone_e164?: string;
  canal?: string | { label: string };
  status?: string | { label: string };
}

export interface UpdateMutationOutput {
  query: string;
  debug: {
    boardId: number;
    itemId: number;
    phoneDigits: string;
    dateStr: string;
    hourObj: { hour: number; minute: number } | null;
    columnValues: Record<string, unknown>;
  };
}

export function buildUpdateMutation(input: UpdateMutationInput): UpdateMutationOutput {
  const cmap = input.column_map || {};
  const boardId = Number(input.monday_board_id || input.board_id || 0);
  const itemId = Number(input.monday_item_id || input.item_id || 0);

  if (!boardId) throw new Error('BuildUpdateGQL: board_id invalido');
  if (!itemId) throw new Error('BuildUpdateGQL: monday_item_id/item_id invalido');

  const tz = str(input.timezone || 'America/Sao_Paulo');
  const t = nowInTZ(tz);
  const phoneDigits = pickPhoneDigits(input);

  // Column IDs
  const phoneColId = cmap.phone || 'telefone2';
  const dateColId = cmap.date_in || cmap.date || 'data';
  const timeColId = cmap.time_in || cmap.hour_in || null; // null se não mapeado (fix tipo tags)

  const col: Record<string, unknown> = {};

  if (phoneDigits) {
    col[phoneColId] = { phone: `+${phoneDigits}`, countryShortName: 'BR' };
  }

  col[dateColId] = { date: t.dateStr };

  // Só escreve hora se a coluna foi mapeada (evita erro em colunas tipo tags)
  if (timeColId) {
    col[timeColId] = { hour: t.hour, minute: t.minute };
  }

  // Canal e status
  const canalColId = cmap.channel || 'status_1';
  const statusColId = cmap.status || 'status';
  const canalLabel = typeof input.canal === 'object' ? input.canal?.label : str(input.canal);
  const statusLabel = typeof input.status === 'object' ? input.status?.label : str(input.status);

  if (canalLabel) col[canalColId] = { label: canalLabel };
  if (statusLabel) col[statusColId] = { label: statusLabel };

  const mutation = `
mutation {
  change_multiple_column_values(
    board_id: ${boardId},
    item_id: ${itemId},
    column_values: "${toColumnValuesString(col)}"
  ) { id }
}`.trim();

  return {
    query: mutation,
    debug: {
      boardId,
      itemId,
      phoneDigits,
      dateStr: t.dateStr,
      hourObj: timeColId ? { hour: t.hour, minute: t.minute } : null,
      columnValues: col,
    },
  };
}

// --- Helpers ---

function str(v: unknown): string {
  return v === undefined || v === null ? '' : String(v);
}

function digits(v: string): string {
  return str(v).replace(/[^\d]/g, '');
}

function gqlEscape(s: string): string {
  return str(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

function toColumnValuesString(obj: Record<string, unknown>): string {
  return gqlEscape(JSON.stringify(obj));
}

function nowInTZ(tz: string) {
  const d = new Date();
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(d);
  const get = (type: string) => parts.find(p => p.type === type)?.value || '00';
  return { dateStr: `${get('year')}-${get('month')}-${get('day')}`, hour: Number(get('hour')), minute: Number(get('minute')) };
}

function pickPhoneDigits(j: UpdateMutationInput): string {
  let p = str(j.phone_e164);
  p = p.replace(/@.*$/, '');
  return digits(p);
}
