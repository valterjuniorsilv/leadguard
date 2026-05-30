/**
 * Presentation: Evolution Inbound Webhook Handler
 *
 * Ponto de entrada do pipeline LeadGuard.
 * Recebe webhook da Evolution API e orquestra o fluxo:
 *
 * 1. Filtra eventos inválidos (grupos, fromMe)
 * 2. Normaliza payload
 * 3. Monta contexto do lead
 * 4. Extrai campos para dedup
 * 5. Deduplicação (PostgreSQL)
 * 6. Busca config do cliente
 * 7. Mapeia colunas Monday
 * 8. Cria ou atualiza lead no Monday
 *
 * No n8n, esta lógica está distribuída entre nodes (Webhook + IF + Code nodes).
 * Aqui está centralizada para referência e futura extração do n8n.
 */

import type { N8nWebhookInput } from '../../infrastructure/evolution-api/types';
import { normalizeEvolutionPayload } from '../../application/use-cases/normalize-payload';
import { buildLeadContext } from '../../application/use-cases/build-lead-context';
import { extractDedupFields } from '../../application/use-cases/extract-dedup-fields';
import { buildColumnMap } from '../../application/use-cases/build-column-map';
import { mergeColumnMap } from '../../application/use-cases/merge-column-map';
import { applyClientConfig } from '../../application/use-cases/apply-client-config';
import { buildCreateMutation } from '../../application/use-cases/build-create-mutation';
import { buildUpdateMutation } from '../../application/use-cases/build-update-mutation';

/**
 * Fluxo completo de processamento de lead (referência)
 *
 * No n8n, cada step é um node separado.
 * Aqui está como orquestração sequencial para documentação.
 */
export async function handleEvolutionInbound(
  webhookInput: N8nWebhookInput,
  deps: {
    leadRepository: import('../../domain/interfaces/lead-repository').ILeadRepository;
    mondayClient: import('../../domain/interfaces/monday-client').IMondayClient;
    clientConfig: { boardId: number; groupId: string; timezone: string; columnMapDb?: Record<string, string> };
  },
): Promise<{ action: 'created' | 'updated' | 'skipped'; itemId?: number }> {

  // Step 1: Normalizar payload
  const normalized = normalizeEvolutionPayload(webhookInput);

  // Step 2: Filtrar eventos inválidos
  if (normalized.is_group) return { action: 'skipped' };
  if (normalized.fromMe) return { action: 'skipped' };
  if (!normalized.event || normalized.event !== 'messages.upsert') return { action: 'skipped' };

  // Step 3: Contexto do lead
  const context = buildLeadContext(normalized);

  // Step 4: Deduplicação
  const dedup = extractDedupFields(webhookInput);
  const isDuplicate = await deps.leadRepository.isDuplicate({
    instance: dedup.instance,
    messageId: dedup.message_id,
    remoteJid: dedup.remote_jid,
  });
  if (isDuplicate) return { action: 'skipped' };

  // Step 5: Buscar colunas do Monday
  const columns = await deps.mondayClient.getBoardColumns(deps.clientConfig.boardId);

  // Step 6: Mapear colunas
  const columnMapResult = buildColumnMap({
    data: { boards: [{ columns, name: 'Board' }] },
  });

  // Step 7: Merge com config do DB
  const merged = mergeColumnMap({
    column_map_auto: columnMapResult.column_map_auto,
    column_map_db: deps.clientConfig.columnMapDb as any,
  });

  // Step 8: Aplicar config do cliente
  const enriched = applyClientConfig(
    { ...context, column_map: merged.column_map, timezone: deps.clientConfig.timezone },
    normalized,
  );

  // Step 9: Criar ou atualizar
  const existingItemId = await deps.leadRepository.findExistingLead(
    normalized.instance || '',
    normalized.lead_key,
  );

  if (existingItemId) {
    const { query } = buildUpdateMutation({
      ...enriched,
      monday_board_id: deps.clientConfig.boardId,
      monday_item_id: existingItemId,
    } as any);
    await deps.mondayClient.updateItem({
      boardId: deps.clientConfig.boardId,
      itemId: existingItemId,
      columnValues: {},
    });
    return { action: 'updated', itemId: existingItemId };
  } else {
    const { query } = buildCreateMutation({
      ...enriched,
      monday_board_id: deps.clientConfig.boardId,
      monday_group_new: deps.clientConfig.groupId,
    } as any);
    const newId = await deps.mondayClient.createItem({
      boardId: deps.clientConfig.boardId,
      groupId: deps.clientConfig.groupId,
      itemName: context.item_name,
      columnValues: {},
    });
    await deps.leadRepository.saveLeadMap({
      instance: normalized.instance || '',
      leadKey: normalized.lead_key,
      mondayItemId: newId,
      mondayBoardId: deps.clientConfig.boardId,
    });
    return { action: 'created', itemId: newId };
  }
}
