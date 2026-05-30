/**
 * IMondayClient — Interface do domínio para operações no Monday.com
 *
 * Implementação concreta fica em infrastructure/monday.
 * Garante que o domínio não depende de detalhes HTTP/GraphQL.
 */

import type { MondayColumn } from '../value-objects/column-map';

export interface CreateItemParams {
  boardId: number;
  groupId: string;
  itemName: string;
  columnValues: Record<string, unknown>;
}

export interface UpdateItemParams {
  boardId: number;
  itemId: number;
  columnValues: Record<string, unknown>;
}

export interface IMondayClient {
  /**
   * Busca colunas de um board
   */
  getBoardColumns(boardId: number): Promise<MondayColumn[]>;

  /**
   * Cria novo item no board
   * @returns ID do item criado
   */
  createItem(params: CreateItemParams): Promise<number>;

  /**
   * Atualiza colunas de um item existente
   */
  updateItem(params: UpdateItemParams): Promise<void>;
}
