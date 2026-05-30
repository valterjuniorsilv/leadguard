/**
 * ColumnMap Value Object
 *
 * Mapeamento lógico de campos do lead para IDs de colunas do Monday.com.
 * Suporta aliases (date_in/date/data_entrada) e validação de campos obrigatórios.
 */

export interface ColumnMapData {
  phone: string | null;
  date_in: string | null;
  time_in: string | null;
  channel: string | null;
  status: string | null;
  responsavel: string | null;
  /** Aliases */
  date: string | null;
  hour_in: string | null;
}

export interface MondayColumn {
  id: string;
  title: string;
  type: string;
}

export class ColumnMap {
  private constructor(private readonly data: ColumnMapData) {}

  /**
   * Constrói mapa de colunas a partir da resposta GraphQL do Monday
   */
  static fromMondayColumns(columns: MondayColumn[]): ColumnMap {
    const norm = (s: string): string =>
      String(s || '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

    const byTitleExact = (t: string) => columns.find(c => norm(c.title) === norm(t))?.id || null;
    const byTitleIncludes = (frag: string) => columns.find(c => norm(c.title).includes(norm(frag)))?.id || null;
    const byTypeFirst = (type: string) => columns.find(c => c.type === type)?.id || null;

    const phoneId = byTitleExact('Telefone') || byTitleIncludes('telefone') || byTypeFirst('phone');
    const dateId = byTitleExact('Data Entrada') || byTitleExact('DataEntrada') || byTitleIncludes('data entrada') || byTypeFirst('date');
    const timeId = byTitleExact('Hora Entrada') || byTitleExact('HoraEntrada') || byTitleIncludes('hora entrada') || byTypeFirst('hour');
    const channelId = byTitleExact('Canal') || byTitleIncludes('canal');
    const statusId = byTitleExact('Status') || byTitleIncludes('status');
    const respId = byTitleExact('Resp.') || byTitleExact('Responsável') || byTitleExact('Responsavel') || byTitleIncludes('resp');

    // Validação de tipo: time_in só aceita coluna tipo 'hour'
    // Se a coluna encontrada for 'tags' ou outro tipo, ignora (fix Karol SorrisoSaudavel)
    let validTimeId = timeId;
    if (timeId) {
      const timeCol = columns.find(c => c.id === timeId);
      if (timeCol && timeCol.type !== 'hour') {
        validTimeId = null;
      }
    }

    return new ColumnMap({
      phone: phoneId,
      date_in: dateId,
      time_in: validTimeId,
      channel: channelId,
      status: statusId,
      responsavel: respId,
      date: dateId,
      hour_in: validTimeId,
    });
  }

  /**
   * Merge com mapa do banco de dados (client_config)
   */
  mergeWith(dbMap: Partial<ColumnMapData>): ColumnMap {
    const merged = { ...this.data };
    for (const [key, val] of Object.entries(dbMap)) {
      if (val && key in merged) {
        (merged as Record<string, string | null>)[key] = val;
      }
    }

    // Resolver aliases
    if (!merged.date_in && merged.date) merged.date_in = merged.date;
    if (!merged.date && merged.date_in) merged.date = merged.date_in;
    if (!merged.time_in && merged.hour_in) merged.time_in = merged.hour_in;
    if (!merged.hour_in && merged.time_in) merged.hour_in = merged.time_in;

    return new ColumnMap(merged);
  }

  get phoneId(): string | null { return this.data.phone; }
  get dateInId(): string | null { return this.data.date_in; }
  get timeInId(): string | null { return this.data.time_in; }
  get channelId(): string | null { return this.data.channel; }
  get statusId(): string | null { return this.data.status; }

  /**
   * Lista campos faltantes
   */
  get missingColumns(): string[] {
    const missing: string[] = [];
    if (!this.data.date_in) missing.push('date_in (Data Entrada)');
    if (!this.data.time_in && !this.data.hour_in) missing.push('time_in/hour_in (Hora Entrada)');
    return missing;
  }

  toJSON(): ColumnMapData {
    return { ...this.data };
  }
}
