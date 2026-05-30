/**
 * Use Case: Build Column Map
 *
 * Parseia a resposta GraphQL do Monday.com e constrói mapeamento
 * de nomes lógicos para IDs reais de colunas.
 *
 * Corresponde ao Code node: "Code :: Build Column Map"
 *
 * Input: Resposta GraphQL com boards[0].columns[]
 * Output: column_map_auto com phone, date_in, time_in, channel, status, responsavel
 */

import { ColumnMap, type MondayColumn } from '../../domain/value-objects/column-map';

export interface BuildColumnMapInput {
  data?: {
    boards?: Array<{
      name?: string;
      columns?: MondayColumn[];
    }>;
  };
  errors?: Array<{ message?: string }>;
}

export interface BuildColumnMapOutput {
  board_name: string | null;
  column_map_auto: ReturnType<ColumnMap['toJSON']>;
}

export function buildColumnMap(input: BuildColumnMapInput): BuildColumnMapOutput {
  if (Array.isArray(input.errors) && input.errors.length) {
    throw new Error(`Monday GraphQL error: ${input.errors[0]?.message || 'unknown error'}`);
  }

  const boards = input.data?.boards;
  if (!Array.isArray(boards) || !boards.length) {
    throw new Error('BuildColumnMap: boards vazio (board_id invalido ou sem acesso)');
  }

  const columns = boards[0]?.columns;
  if (!Array.isArray(columns) || !columns.length) {
    throw new Error('BuildColumnMap: columns vazio (sem permissao ou retorno inesperado)');
  }

  const columnMap = ColumnMap.fromMondayColumns(columns);

  return {
    board_name: boards[0]?.name || null,
    column_map_auto: columnMap.toJSON(),
  };
}
