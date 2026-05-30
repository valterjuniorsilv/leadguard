/**
 * PhoneNumber Value Object
 *
 * Encapsula toda lógica de extração, validação e formatação de telefone.
 * Suporta múltiplas fontes: senderPn, remoteJidAlt (LID), sender, remoteJid.
 *
 * Cadeia de prioridade:
 *   senderPn -> remoteJidAlt -> sender -> remoteJid (se pessoa)
 */

export class PhoneNumber {
  private readonly _digits: string;

  private constructor(digits: string) {
    this._digits = digits;
  }

  /**
   * Cria PhoneNumber a partir de múltiplos candidatos (cadeia de prioridade)
   */
  static fromCandidates(candidates: {
    senderPn?: string | null;
    remoteJidAlt?: string | null;
    sender?: string | null;
    remoteJid?: string | null;
  }): PhoneNumber {
    const { senderPn, remoteJidAlt, sender, remoteJid } = candidates;

    const digits =
      PhoneNumber.jidToDigits(senderPn) ||
      PhoneNumber.jidToDigits(remoteJidAlt) ||
      PhoneNumber.jidToDigits(sender) ||
      PhoneNumber.jidToDigits(remoteJid) ||
      '';

    return new PhoneNumber(digits);
  }

  /**
   * Cria a partir de string de dígitos já limpa
   */
  static fromDigits(digits: string): PhoneNumber {
    return new PhoneNumber(PhoneNumber.stripToDigits(digits));
  }

  /**
   * Extrai dígitos de um JID WhatsApp (@s.whatsapp.net)
   */
  private static jidToDigits(jid: string | null | undefined): string {
    if (!jid || typeof jid !== 'string') return '';
    const match = jid.match(/^(\d+)@s\.whatsapp\.net$/i);
    return match ? match[1] : '';
  }

  /**
   * Remove tudo que não é dígito
   */
  private static stripToDigits(s: string): string {
    return (s || '').toString().replace(/\D+/g, '');
  }

  get digits(): string { return this._digits; }
  get isValid(): boolean { return this._digits.length >= 10; }
  get status(): 'OK' | 'MISSING' { return this.isValid ? 'OK' : 'MISSING'; }

  /**
   * Formato E.164 com prefixo +
   */
  get formatted(): string {
    return this.isValid ? `+${this._digits}` : '';
  }

  /**
   * Formato Monday.com para coluna phone
   */
  toMondayFormat(): { phone: string; countryShortName: string } | null {
    if (!this.isValid) return null;
    return { phone: `+${this._digits}`, countryShortName: 'BR' };
  }
}

/**
 * Helpers de JID (usados em múltiplos contextos)
 */
export function isGroupJid(jid: string | null): boolean {
  return typeof jid === 'string' && /@g\.us$/i.test(jid);
}

export function isLidJid(jid: string | null): boolean {
  return typeof jid === 'string' && /@lid$/i.test(jid);
}

export function isPhoneJid(jid: string | null): boolean {
  return typeof jid === 'string' && /@s\.whatsapp\.net$/i.test(jid);
}
