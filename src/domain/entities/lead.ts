/**
 * Lead Entity — Coração do domínio LeadGuard
 *
 * Representa um lead capturado via WhatsApp (Evolution API).
 * Contém regras de negócio para validação e construção do lead.
 */

import { PhoneNumber } from '../value-objects/phone-number';
import { LeadKey } from '../value-objects/lead-key';

export interface LeadProps {
  instance: string;
  contactName: string;
  phone: PhoneNumber;
  leadKey: LeadKey;
  message: string | null;
  messageTimestamp: number | null;
  fromMe: boolean;
  isGroup: boolean;
  remoteJid: string | null;
  remoteJidAlt: string | null;
  pushName: string | null;
  messageType: string | null;
}

export class Lead {
  private constructor(private readonly props: LeadProps) {}

  static create(props: LeadProps): Lead {
    if (!props.instance) {
      throw new DomainError('Lead requer instance');
    }
    if (props.isGroup) {
      throw new DomainError('Grupos não são leads');
    }
    if (props.fromMe) {
      throw new DomainError('Mensagens próprias não geram lead');
    }
    return new Lead(props);
  }

  get instance(): string { return this.props.instance; }
  get contactName(): string { return this.props.contactName; }
  get phone(): PhoneNumber { return this.props.phone; }
  get leadKey(): LeadKey { return this.props.leadKey; }
  get message(): string | null { return this.props.message; }
  get messageTimestamp(): number | null { return this.props.messageTimestamp; }
  get fromMe(): boolean { return this.props.fromMe; }
  get isGroup(): boolean { return this.props.isGroup; }
  get remoteJid(): string | null { return this.props.remoteJid; }
  get pushName(): string | null { return this.props.pushName; }

  /**
   * Nome para exibição no CRM
   */
  get itemName(): string {
    if (this.contactName) return this.contactName;
    if (this.phone.isValid) return `Lead WhatsApp - ${this.phone.formatted}`;
    return 'Lead WhatsApp';
  }

  /**
   * Verifica se o lead tem telefone válido
   */
  get hasValidPhone(): boolean {
    return this.phone.isValid;
  }
}

export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainError';
  }
}
