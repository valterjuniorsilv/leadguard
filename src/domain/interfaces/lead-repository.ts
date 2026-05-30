/**
 * ILeadRepository — Interface do domínio para persistência de leads
 *
 * Implementação concreta fica em infrastructure/postgres.
 * Application layer usa esta interface via injeção de dependência.
 */

export interface DedupFields {
  instance: string;
  messageId: string;
  remoteJid: string;
}

export interface LeadMapEntry {
  instance: string;
  leadKey: string;
  mondayItemId: number;
  mondayBoardId: number;
}

export interface ILeadRepository {
  /**
   * Verifica se mensagem já foi processada (deduplicação)
   * @returns true se é duplicata (já processada)
   */
  isDuplicate(fields: DedupFields): Promise<boolean>;

  /**
   * Busca item existente no Monday para o lead
   * @returns mondayItemId ou null se lead é novo
   */
  findExistingLead(instance: string, leadKey: string): Promise<number | null>;

  /**
   * Registra novo lead no mapa
   */
  saveLeadMap(entry: LeadMapEntry): Promise<void>;
}
