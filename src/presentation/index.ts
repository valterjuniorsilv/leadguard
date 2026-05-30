/**
 * Presentation Layer — Exports
 *
 * Entry points: webhook handlers.
 * ZERO regra de negócio — delega tudo para application/.
 */

export { handleEvolutionInbound } from './webhook/evolution-inbound';
