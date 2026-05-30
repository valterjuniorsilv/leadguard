# LeadGuard

[![CI](https://github.com/valterjuniorsilv/leadguard/actions/workflows/ci.yml/badge.svg)](https://github.com/valterjuniorsilv/leadguard/actions) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![Release](https://img.shields.io/github/v/release/valterjuniorsilv/leadguard)](https://github.com/valterjuniorsilv/leadguard/releases) [![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)](https://www.typescriptlang.org/)

> Pipeline de ingestão de leads **WhatsApp → CRM** com proteção contra race conditions, deduplicação distribuída e mapeamento dinâmico de colunas. Referência de **Clean Architecture + DDD** em TypeScript, extraída de produção e sanitizada.

Cliente envia mensagem no WhatsApp → Evolution API dispara webhook → o pipeline normaliza, dedupe, aplica lock distribuído, busca config do cliente, mapeia colunas dinamicamente do CRM e cria/atualiza o lead via GraphQL. Sem perder mensagem, sem criar duplicata, mesmo quando o usuário manda 4 mensagens em 200ms.

---

## Por que esse repo existe

A maioria dos pipelines de WhatsApp → CRM que vi em produção sofre dos mesmos problemas:

- Duplica lead quando o usuário manda 3 mensagens em sequência rápida (race condition)
- Quebra quando o cliente muda nome de coluna no CRM (mapping hardcoded)
- Perde mensagem em retry porque a operação não é idempotente
- Vira spaghetti de `if` quando precisa atender mais de 1 cliente (multi-tenant)
- DDL em tempo de execução (`CREATE TABLE IF NOT EXISTS` por mensagem) trava o banco em volume

LeadGuard resolve cada um desses no design da arquitetura, não em patch.

---

## Arquitetura

Clean Architecture estrita, 4 camadas:

```
src/
├── domain/                    # Entities, Value Objects, interfaces de repositório
│   ├── entities/              # Lead, Message
│   ├── value-objects/         # PhoneNumber, LeadKey, ColumnMap
│   └── interfaces/            # LeadRepository, MondayClient
│
├── application/               # Use Cases (orquestra o domínio)
│   └── use-cases/
│       ├── normalize-payload.ts
│       ├── extract-dedup-fields.ts
│       ├── apply-client-config.ts
│       ├── build-lead-context.ts
│       ├── build-column-map.ts
│       ├── merge-column-map.ts
│       ├── build-create-mutation.ts
│       └── build-update-mutation.ts
│
├── presentation/              # HTTP/webhook handlers (entrada/saída de dados)
│   └── webhook/
│       └── evolution-inbound.ts
│
└── infrastructure/            # Implementações concretas (DB, APIs externas)
    ├── monday/                # GraphQL client + date helpers
    └── evolution-api/         # Types da Evolution API
```

### Leis invioláveis aplicadas

1. **Dependency Inversion Principle (DIP)** — `application` recebe `LeadRepository` e `MondayClient` por construtor, nunca importa implementações concretas
2. **Idempotência** — toda operação é Retry-Safe via `processed_messages` table com `message_id` como dedup key
3. **Separation of Concerns** — `presentation/` só faz parse/DTO, zero regra de negócio
4. **Custom Errors** — `DomainError`, `InfraError`, sem `try/catch` vazio, sem leak de stack trace

---

## Padrões interessantes

### 1. Distributed Lock em Postgres

Usa duas tabelas (`lead_locks` + `lead_reservations`) pra serializar requests concorrentes do mesmo lead — evita criar 2 itens no CRM quando 4 mensagens chegam em 200ms.

### 2. Column Map dinâmico

Em vez de hardcode `{ name: "col1", phone: "col5" }`, o pipeline consulta a estrutura real do board via GraphQL no startup do request, compara com o ColumnMap esperado, e gera a mutation com os IDs corretos. Cliente pode renomear colunas no CRM sem quebrar nada.

### 3. Multi-tenant via `instance`

Toda config (board ID, column overrides, sheets de referência) é resolvida por `instance` no `apply-client-config.ts` — adicionar cliente novo é INSERT no `client_config`, zero deploy.

### 4. GraphQL puro em vez de SDK

Usa Raw HTTP nodes batendo direto no `api.monday.com/v2` em vez de SDK do Monday — flexibilidade total + zero abstração leaky de SDK.

---

## Stack

| Layer | Tech |
|---|---|
| Language | TypeScript (Node ≥ 20) |
| Database | PostgreSQL (locks + dedup + multi-tenant config) |
| CRM target | Monday.com (Graph API v2) — adaptável pra HubSpot, Pipedrive, qualquer GraphQL/REST |
| Source | Evolution API (WhatsApp Business Cloud) |
| Orchestration | N8N para workflow visual (opcional — código TS é runnable standalone) |

---

## Não está aqui (de propósito)

Esse repo é a **referência de arquitetura**. Pra rodar em produção você precisa adicionar:

- Postgres com migrations das tabelas (`processed_messages`, `lead_locks`, `lead_reservations`, `client_config`, `lead_map`)
- Credenciais (`MONDAY_TOKEN`, `EVOLUTION_API_URL`, `DB_URL`)
- Workflow N8N de orquestração (ou um runtime Node próprio que importa o `src/`)
- Infraestrutura: workers, queue, observabilidade

Tudo isso fica fora do repo público porque é específico da operação. O **valor** aqui é a arquitetura sanitizada.

---

## Análise técnica completa

[`docs/architecture-analysis.md`](./docs/architecture-analysis.md) — auditoria do workflow original com pontos fortes, anti-padrões observados, e melhorias propostas.

---

## Roadmap

- [ ] **v0.2** — Migrations Postgres exemplificando schema
- [ ] **v0.3** — Adapter genérico de CRM (Monday + HubSpot + Pipedrive)
- [ ] **v0.4** — Workflow N8N exportado (sanitizado, sem cliente real)
- [ ] **v0.5** — Worker Node runnable standalone

---

## License

MIT — see [LICENSE](./LICENSE).

---

## Author

**Valter Silva** · [github.com/valterjuniorsilv](https://github.com/valterjuniorsilv) · Maringá, BR

Open to remote engineering roles (AI Automation Engineer, Workflow Engineer, Backend Python/TypeScript).
