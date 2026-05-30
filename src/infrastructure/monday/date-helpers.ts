/**
 * Infrastructure: Date/Time Helpers
 *
 * Formatação de data/hora no timezone do cliente sem dependências externas.
 * Usa Intl.DateTimeFormat nativo do JavaScript.
 */

export interface DateTimeParts {
  dateStr: string;   // YYYY-MM-DD
  hour: number;
  minute: number;
  hhmm: string;      // HH:MM
}

/**
 * Retorna data/hora "agora" no timezone especificado
 */
export function nowInTimezone(tz: string = 'America/Sao_Paulo'): DateTimeParts {
  return formatDateInTimezone(new Date(), tz);
}

/**
 * Converte timestamp Unix (segundos) para data/hora no timezone
 */
export function timestampToTimezone(tsSeconds: number, tz: string = 'America/Sao_Paulo'): DateTimeParts {
  const d = new Date(Number(tsSeconds) * 1000);
  return formatDateInTimezone(d, tz);
}

function formatDateInTimezone(d: Date, tz: string): DateTimeParts {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d);

  const get = (type: string) => parts.find(p => p.type === type)?.value || '00';

  const yyyy = get('year');
  const mm = get('month');
  const dd = get('day');
  const hh = get('hour');
  const mi = get('minute');

  return {
    dateStr: `${yyyy}-${mm}-${dd}`,
    hour: Number(hh),
    minute: Number(mi),
    hhmm: `${hh}:${mi}`,
  };
}
