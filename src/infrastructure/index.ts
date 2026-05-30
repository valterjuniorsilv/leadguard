/**
 * Infrastructure Layer — Exports
 *
 * Implementações concretas: Monday GraphQL, Evolution API types, date helpers.
 * Implementa interfaces definidas em domain/.
 */

// Monday.com
export {
  gqlEscape,
  toColumnValuesString,
  buildGetColumnsQuery,
  buildCreateItemMutation,
  buildUpdateItemMutation,
} from './monday/gql-builder';

export {
  nowInTimezone,
  timestampToTimezone,
} from './monday/date-helpers';
export type { DateTimeParts } from './monday/date-helpers';

// Evolution API
export type {
  EvolutionWebhookPayload,
  EvolutionMessageData,
  EvolutionMessageKey,
  EvolutionMessage,
  N8nWebhookInput,
} from './evolution-api/types';
