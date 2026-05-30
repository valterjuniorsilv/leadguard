/**
 * Domain Layer — Exports
 *
 * Coração do negócio LeadGuard.
 * ZERO dependências externas.
 */

// Entities
export { Lead, DomainError } from './entities/lead';
export type { LeadProps } from './entities/lead';
export { Message } from './entities/message';
export type { RawWhatsAppMessage } from './entities/message';

// Value Objects
export { PhoneNumber, isGroupJid, isLidJid, isPhoneJid } from './value-objects/phone-number';
export { LeadKey } from './value-objects/lead-key';
export { ColumnMap } from './value-objects/column-map';
export type { ColumnMapData, MondayColumn } from './value-objects/column-map';

// Interfaces (contratos para infrastructure)
export type { ILeadRepository, DedupFields, LeadMapEntry } from './interfaces/lead-repository';
export type { IMondayClient, CreateItemParams, UpdateItemParams } from './interfaces/monday-client';
