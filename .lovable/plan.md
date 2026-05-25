
# Plano de Implementação

Vou dividir em **duas fases sequenciais**. Cada fase é entregue como bloco testável.

---

## FASE 1 — Etiquetas, Atribuição e Histórico (Frontend)

Mantém o localStorage atual; tudo funciona offline antes de migrar para o backend.

### 1.1 Sistema de Etiquetas QR Code

- Adicionar dependência `qrcode` (geração SVG/PNG) e `html5-qrcode` (leitura via câmara).
- O campo `code` do ativo já existe (formato `IMB-AAAA-NNNN`). Garantir geração automática consistente.
- **Ficha do ativo (`/ativos/$id`)**: novo botão **"Gerar QR Code da Etiqueta"** que abre um diálogo com:
  - QR Code do código do ativo (link directo: `/ativos/{id}`)
  - Etiqueta imprimível A6 com logo, código, descrição, filial e QR
  - Botão "Imprimir" (window.print com CSS dedicado)
- Adicionar `Termo de Responsabilidade` imprimível na mesma lógica.

### 1.2 Scanner de Câmara

- Botão grande **"Escanear Etiqueta"** no topo do Dashboard e da página Inventário.
- Nova rota `/scan` que:
  - Abre câmara traseira (preferred) via `html5-qrcode`
  - Ao ler um QR/barcode, parseia o código (suporta URL ou código simples `IMB-...`)
  - Faz `navigate` directo para `/ativos/$id` se encontrado, senão toast de erro
  - Botão fallback "Inserir código manualmente"

### 1.3 Responsável pelo Ativo

- Estender `Asset` type com:
  ```ts
  custodian?: {
    name: string;
    taxId?: string;      // NIF
    assignedDate: string;
    responsibilityTermSigned: boolean;
    termSignedDate?: string;
  }
  ```
- Nova secção **"Responsável pelo Ativo"** no formulário `/ativos/novo` e numa nova rota `/ativos/$id/editar`.
- Botão **"Gerar Termo de Responsabilidade"** que abre PDF-style imprimível com cláusulas standard (Decreto 207/15 e dever de guarda).
- Ao marcar termo como assinado → regista data e mostra badge verde.

### 1.4 Histórico de Uso (Custódia)

- Novo tipo `CustodyRecord`:
  ```ts
  { id, assetId, custodianName, taxId?, startDate, endDate?, note? }
  ```
- Store separada (`useCustody`) em localStorage.
- Quando o responsável muda → fecha registo anterior (`endDate = hoje`) e abre novo.
- Na ficha do ativo (`/ativos/$id`): nova aba/tabela **"Histórico de Uso"** com timeline ("De Jan/2025 a Mar/2026: João Silva …").

---

## FASE 2 — Backend Supabase + Autenticação

### 2.1 Activar Lovable Cloud
Cria o projecto Supabase e gera os clients.

### 2.2 Schema (migration SQL)

Tabelas espelhando os tipos actuais:
- `branches` (id, code, name, type, province, address, manager_name)
- `departments` (id, branch_id, name)
- `physical_locations` (id, department_id, name)
- `assets` (todos os campos de `Asset` incluindo `custodian_*` flat columns, `code` UNIQUE)
- `transfers` (histórico de transferências)
- `custody_records` (histórico de responsáveis)

**RLS**: como escolheste "auth básico" sem perfis → políticas simples:
`USING (auth.uid() IS NOT NULL)` em todas as tabelas (qualquer utilizador autenticado lê/escreve). Sem segregação por filial (podemos adicionar mais tarde).

### 2.3 Autenticação Email/Password

- Página `/login` (signup + signin no mesmo ecrã, toggle)
- Layout pathless `_authenticated` que protege todas as rotas existentes
- `__root.tsx` com `onAuthStateChange` listener
- Logout no `AppShell`
- Confirmação de email **desactivada** (signup imediato — para testes ágeis)

### 2.4 Migração de Dados

- Substituir hooks `useAssets`, `useOrg`, `useCustody` por queries Supabase via TanStack Query
- Hook `useMigrateLocalData()` que corre no primeiro login:
  - Lê localStorage existente
  - Faz upsert em batch para Supabase
  - Marca `localStorage['migrated_v1']=true` para não repetir
  - Mostra toast "X ativos importados"

### 2.5 Reorganização de Rotas
```
/login                          (público)
/_authenticated/                (protegido)
  ├─ index.tsx (dashboard)
  ├─ inventario.tsx
  ├─ ativos.novo.tsx
  ├─ ativos.$id.tsx
  ├─ ativos.$id.editar.tsx       ← NOVO
  ├─ scan.tsx                    ← NOVO
  ├─ classes.tsx
  ├─ tabela-taxas.tsx
  ├─ filiais.tsx
  └─ transferencias.tsx
```

---

## Notas Técnicas

- **`qrcode`** e **`html5-qrcode`** são puros JS (Worker-safe; mas o scanner só corre no browser).
- Termo de responsabilidade e etiqueta usam `window.print()` com `@media print` no CSS (sem dependências PDF pesadas).
- Migração será idempotente (UPSERT por `code` do ativo).
- A FASE 2 vai exigir reescrever os 3 stores → vou manter a mesma API pública dos hooks (`useAssets()` retornará `{assets, create, update, ...}`) para minimizar alterações nas páginas.

---

## Entrega

Aviso-te no fim de cada fase para validares antes de avançar. Posso começar pela **Fase 1** agora?
