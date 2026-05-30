# 🛡️ Análise do Workflow: LeadGuard | Proteção Operacional de Leads (Monday)
**ID:** `W55ac6PZ2ew0R2lb`

O workflow atual é um pipeline altamente estruturado de ingestão de webhooks vindos da **Evolution API (WhatsApp)** para a criação e atualização de leads no **Monday.com**.

## 📊 Estrutura e Fluxo Lógico (Visão Geral)
1. **Ingestão e Filtro**: Recebe dados e filtra mensagens inválidas ou grupos (`Webhook` -> `IF: Is Valid Lead Event`).
2. **Normalização**: Padroniza as informações do payload sujo em um "Envelopamento" de contexto limpo e seguro usando Nodes de `Code`.
3. **Deduplicação**: Executa um `Dedup Insert` no PostgreSQL usando a tabela `processed_messages`. Aborta a execução se houver colisão de message_id.
4. **Validação de Configuração**: Busca as parametrizações do cliente num Google Sheets, inserindo-as em cache no Postgres (`client_config`), e lendo na sequência.
5. **Mapeamento de Colunas (Monday)**: Consulta via HTTP Graph API do Monday.com a estrutura real dos boards para saber como bater as colunas dinamicamente (nodes de Merge e Code).
6. **Controle de Concorrência e Lock**: 
   - Utiliza um Distributed Lock em Postgres (`lead_locks` e `lead_reservations`) para atrasar ou suspender a execução de webhooks concorrentes do mesmo lead.
   - Isso evita a criação dupla de itens no Monday com mensagens atiradas no mesmo milissegundo.
7. **Integração Monday (GQL)**: Cria ou Atualiza o registro do lead baseado no seu mapeamento com a chave do usuário (`lead_map`), via Raw HTTP Nodes rodando GraphQL puro.

---

## 🟢 Pontos Fortes (O que está ótimo)

*   **Idempotência e Resiliência Inicial:** Excelente design ao usar uma tabela `processed_messages` garantindo a exclusão sumária de fire-and-forget duplicados da Evolution.
*   **Tratamento Anti-Corrida (Race Conditions):** O mecanismo customizado de Locking (`ensure lead_locks`, `Reserve lead_key`) prova que este workflow foi pensado para cargas operacionais agressivas onde o usuário (lead) manda 4 mensagens em um segundo.
*   **Agnosticismo de Instância:** O fluxo todo escala bem para múltiplos clientes ou instâncias (multi-tenant) agrupando via `instance`.
*   **Mapeamento GraphQL Direto:** O uso de requests nativas em HTTP/GraphQL para o Monday garante flexibilidade e performance máxima sem depender de limitações nativas dos nodes do Monday do n8n.

---

## 🔴 Problemas e Pontos de Melhoria (Gargalos)

### 1. DDL em Tempo de Execução (Anti-Pattern)
O workflow executa rotinas `CREATE TABLE IF NOT EXISTS` em cada mensagem ingerida (ex: `PG :: Ensure processed_messages`, `PG :: Ensure lead_reservations`).
*   **Problema:** Em alto volume, rodar comandos estruturais (DDL) bloqueantes aumenta brutalmente o overhead no banco de dados e adiciona latência em cada call.
*   **Solução:** Remover todos os nodes de "Ensure" do fluxo operacional. Criar um workflow sub-anexo de setup de infraestrutura/deploy que inicia as tabelas, ou confiar em migrations manuais no Postgres. 

### 2. Google Sheets como Dependência Operacional 
Atualmente, se não entendi errado o fluxo, há um node `Get :: Client config` de Google Sheets puxando dados do cliente ativamente com a planilha.
*   **Problema:** As cotas de API do Google Sheets podem espancar limites (`429 Too Many Requests`). Sem contar o atraso astronômico global na latência do request inteiro dependendo de APIs externas só pra ver a config.
*   **Solução:** Inverter o fluxo de cache. O banco de dados PostgreSQL deve ser a Fonte Única de Verdade da operação via Webhook. A planilha do Sheets deveria mandar um trigger (via Webhook) *para* o banco sempre que o usuário atualizar, em vez da operação checar a planilha a cada tiro.

### 3. Node Wait (Timeouts Artificiais)
Existe um node `Wait` atrelado aos reservas do Lock do banco (`PG :: Reserved?` -> `Wait`).
*   **Problema:** Execuções do n8n que pausadas (Wait Nodes) pesam imensamente na memória do worker (em RAM em "Running" state) ou sobrecarregam a sub-task do DB interno do n8n.
*   **Solução:** Se a ideia é controle de "debounce/throttle" (juntar as 5 primeiras mensagens), a abordagem correta seria utilizar os eventos da própria Evolution (`messages.upsert` de delay), ou que a 2ª requisição faça APPEND num array em cache e apenas 1 item seja enfileirado para envio pro Monday por vez.

### 4. Nodes de JS Extensos (Manutenibilidade)
O uso pesado de blocos de `Code` para tratar o objeto JSON faz o visual do workflow ficar limpo, mas a manutenibilidade para equipes ficar mais dura (exige coders).
*   **Solução:** Modularizar o sub-processo, movendo a limpeza bruta do payload pra funções encapsuladas ou padronizando propriedades em workflows secundários chamados por `Execute Workflow`.

---

## 🚀 Próximos Passos
O arquivo `LeadGuard_Clone.json` já foi devidamente exportado no Workspace e pode ser importado para aplicação direta das refatorações citadas acima sem impacto ao ambiente produtivo.
