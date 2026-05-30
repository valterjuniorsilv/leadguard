/**
 * Use Case: Merge Column Map
 *
 * Junta column_map_auto (Monday API) com column_map_db (PostgreSQL client_config).
 * Resolve aliases e auto-resolve IDs faltantes por título de coluna.
 *
 * Corresponde ao Code node: "Code :: Merge Column Map"
 *
 * Input: column_map_auto + column_map_db + opcionalmente columns[] para fallback
 * Output: column_map final mergeado + missing_columns
 */

import { ColumnMap, type ColumnMapData, type MondayColumn } from '../../domain/value-objects/column-map';

export interface MergeColumnMapInput {
  column_map_auto?: Partial<ColumnMapData>;
  column_map_db?: Partial<ColumnMapData>;
  data?: {
    boards?: Array<{
      columns?: MondayColumn[];
    }>;
  };
  require_columns?: boolean | string;
}

export interface MergeColumnMapOutput {
  column_map: ColumnMapData;
  missing_columns: string[];
  require_columns: boolean;
}

const DATE_TITLE_VARIANTS = [
  'Data Entrada', 'Data de entrada', 'Entrada',
  'Data', 'Data lead', 'Lead date',
];

const TIME_TITLE_VARIANTS = [
  'Hora Entrada', 'Hora de entrada', 'Horario Entrada',
  'Horário Entrada', 'Hora', 'Horario', 'Horário', 'Lead time',
];

export function mergeColumnMap(input: MergeColumnMapInput): MergeColumnMapOutput {
  const autoMap = input.column_map_auto || {};
  const dbMap = input.column_map_db || {};
  const column_map: Record<string, string | null> = { ...autoMap, ...dbMap } as any;
  const columns = input.data?.boards?.[0]?.columns || [];

  // Resolver aliases
  resolveAliases(column_map);

  // Auto-resolve usando títulos de colunas do Monday
  autoResolveByTitle(column_map, columns);

  // Validação
  const missing_columns: string[] = [];
  if (!column_map.date_in) missing_columns.push('date_in (Data Entrada)');
  if (!column_map.time_in && !column_map.hour_in) missing_columns.push('time_in/hour_in (Hora Entrada)');

  const require_columns = input.require_columns === true || String(input.require_columns || '').toLowerCase() === 'true';
  if (require_columns && missing_columns.length) {
    throw new Error(`MergeColumnMap: faltando ${missing_columns.join(', ')}`);
  }

  return {
    column_map: column_map as unknown as ColumnMapData,
    missing_columns,
    require_columns,
  };
}

function resolveAliases(map: Record<string, string | null>): void {
  if (!map.date_in && map.data_entrada) map.date_in = map.data_entrada;
  if (!map.date_in && map.date) map.date_in = map.date;
  if (!map.date && map.date_in) map.date = map.date_in;

  if (!map.time_in && map.hora_entrada) map.time_in = map.hora_entrada;
  if (!map.time_in && map.hour_in) map.time_in = map.hour_in;
  if (!map.hour_in && map.time_in) map.hour_in = map.time_in;
}

function autoResolveByTitle(map: Record<string, string | null>, columns: MondayColumn[]): void {
  if (!Array.isArray(columns) || !columns.length) return;

  if (!map.date_in) {
    const id = findColIdByTitles(columns, DATE_TITLE_VARIANTS);
    if (id) {
      map.date_in = id;
      map.date = map.date || id;
    }
  }

  if (!map.time_in && !map.hour_in) {
    const id = findColIdByTitles(columns, TIME_TITLE_VARIANTS);
    if (id) {
      // Validar tipo da coluna (fix Karol SorrisoSaudavel)
      const col = columns.find(c => c.id === id);
      if (col && col.type === 'hour') {
        map.time_in = id;
        map.hour_in = id;
      }
    }
  }
}

function findColIdByTitles(columns: MondayColumn[], titles: string[]): string | null {
  const norm = (s: string) =>
    String(s ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

  const wanted = titles.map(norm);
  for (const c of columns) {
    const t = norm(c?.title);
    if (t && wanted.includes(t)) return c.id;
  }
  return null;
}
