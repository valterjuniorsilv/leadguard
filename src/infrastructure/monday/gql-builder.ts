/**
 * Infrastructure: Monday.com GraphQL Builder
 *
 * Helpers para construção de queries/mutations GraphQL do Monday.com.
 * Usado pelos use cases de create e update.
 */

/**
 * Escapa string para uso dentro de GraphQL
 */
export function gqlEscape(str: string): string {
  return String(str ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n');
}

/**
 * Converte objeto de column_values para string JSON escapada (formato Monday)
 */
export function toColumnValuesString(obj: Record<string, unknown>): string {
  return gqlEscape(JSON.stringify(obj));
}

/**
 * Monta query para buscar colunas de um board
 */
export function buildGetColumnsQuery(boardId: number): string {
  return `
query {
  boards(ids: [${boardId}]) {
    name
    columns { id title type }
  }
}`.trim();
}

/**
 * Monta mutation para criar item
 */
export function buildCreateItemMutation(params: {
  boardId: number;
  groupId: string;
  itemName: string;
  columnValues: Record<string, unknown>;
}): string {
  return `
mutation {
  create_item (
    board_id: ${params.boardId},
    group_id: "${gqlEscape(params.groupId)}",
    item_name: "${gqlEscape(params.itemName)}",
    column_values: "${toColumnValuesString(params.columnValues)}"
  ) { id }
}`.trim();
}

/**
 * Monta mutation para atualizar colunas de item existente
 */
export function buildUpdateItemMutation(params: {
  boardId: number;
  itemId: number;
  columnValues: Record<string, unknown>;
}): string {
  return `
mutation {
  change_multiple_column_values(
    board_id: ${params.boardId},
    item_id: ${params.itemId},
    column_values: "${toColumnValuesString(params.columnValues)}"
  ) { id }
}`.trim();
}
