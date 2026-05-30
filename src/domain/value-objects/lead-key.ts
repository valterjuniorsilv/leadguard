/**
 * LeadKey Value Object
 *
 * Identificador único e estável de um lead no pipeline.
 * Formato: "{instance}::{contact_jid}"
 *
 * Garante unicidade por instância WhatsApp + contato.
 */

export class LeadKey {
  private constructor(
    public readonly instance: string,
    public readonly contactJid: string,
    public readonly value: string,
  ) {}

  static create(instance: string, contactJid: string | null): LeadKey {
    const inst = instance || 'unknown';
    const jid = contactJid || 'unknown';
    return new LeadKey(inst, jid, `${inst}::${jid}`);
  }

  toString(): string {
    return this.value;
  }
}
