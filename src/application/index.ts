/**
 * Application Layer — Exports
 *
 * Use Cases que orquestram o domínio.
 * Cada use case corresponde a um Code node do workflow n8n.
 */

export { normalizeEvolutionPayload } from './use-cases/normalize-payload';
export type { NormalizeInput, NormalizedPayload } from './use-cases/normalize-payload';

export { buildLeadContext } from './use-cases/build-lead-context';
export type { LeadContextInput, LeadContext } from './use-cases/build-lead-context';

export { extractDedupFields } from './use-cases/extract-dedup-fields';
export type { DedupFields } from './use-cases/extract-dedup-fields';

export { buildColumnMap } from './use-cases/build-column-map';
export type { BuildColumnMapInput, BuildColumnMapOutput } from './use-cases/build-column-map';

export { mergeColumnMap } from './use-cases/merge-column-map';
export type { MergeColumnMapInput, MergeColumnMapOutput } from './use-cases/merge-column-map';

export { applyClientConfig } from './use-cases/apply-client-config';
export type { ApplyConfigInput, ApplyConfigOutput } from './use-cases/apply-client-config';

export { buildCreateMutation } from './use-cases/build-create-mutation';
export type { CreateMutationInput, CreateMutationOutput } from './use-cases/build-create-mutation';

export { buildUpdateMutation } from './use-cases/build-update-mutation';
export type { UpdateMutationInput, UpdateMutationOutput } from './use-cases/build-update-mutation';
