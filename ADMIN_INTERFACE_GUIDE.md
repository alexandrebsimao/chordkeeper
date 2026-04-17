# Admin Interface Implementation - Planos e Funcionalidades

## Visão Geral

Implementação completa de interface administrativa para gerenciamento de planos e funcionalidades de assinatura, com suporte a planos recorrentes mensais e anuais.

## Estrutura Implementada

### Backend (Rails 8.1)

#### Controllers
- **`Api::Admin::PlansController`** (`/app/controllers/api/admin/plans_controller.rb`)
  - `GET /api/admin/plans` - Lista todos os planos com features associadas
  - `GET /api/admin/plans/:id` - Obtém detalhes de um plano específico
  - `POST /api/admin/plans` - Cria novo plano com features
  - `PATCH /api/admin/plans/:id` - Atualiza plano e suas features
  - `DELETE /api/admin/plans/:id` - Deleta plano
  - `PATCH /api/admin/plans/:id/activate` - Ativa plano
  - `PATCH /api/admin/plans/:id/deactivate` - Desativa plano
  - `PATCH /api/admin/plans/:id/update_features` - Atualiza apenas as features do plano

- **`Api::Admin::FeaturesController`** (`/app/controllers/api/admin/features_controller.rb`)
  - `GET /api/admin/features` - Lista todas as features
  - `GET /api/admin/features/:id` - Obtém detalhes de uma feature
  - `POST /api/admin/features` - Cria nova feature
  - `PATCH /api/admin/features/:id` - Atualiza feature
  - `DELETE /api/admin/features/:id` - Deleta feature

#### Modelos
- **`Plan`** (`/app/models/plan.rb`)
  - Relacionamento `has_many :features through: :plan_features`
  - Métodos: `has_feature?(key)`, `add_feature(key)`, `remove_feature(key)`, `features_list`

- **`Feature`** (`/app/models/feature.rb`)
  - Relacionamento `has_many :plans through: :plan_features`
  - Scope `ordered` para ordenação por `sort_order`

- **`PlanFeature`** (`/app/models/plan_feature.rb`)
  - Junction table M-to-M entre Plan e Feature
  - Validação de unicidade [plan_id, feature_id]

#### Banco de Dados
- **Tabela `features`**
  ```
  id          (integer, primary key)
  key         (string, unique index)
  label       (string)
  description (text)
  sort_order  (integer)
  created_at  (datetime)
  updated_at  (datetime)
  ```

- **Tabela `plan_features`**
  ```
  id          (integer, primary key)
  plan_id     (integer, foreign key)
  feature_id  (integer, foreign key)
  created_at  (datetime)
  updated_at  (datetime)
  unique index on [plan_id, feature_id]
  ```

#### Rotas (config/routes.rb)
```ruby
namespace :api do
  namespace :admin do
    resources :plans do
      member do
        patch :activate
        patch :deactivate
        patch :update_features
      end
    end
    
    resources :features
  end
end
```

### Frontend (React/TypeScript)

#### Páginas Administrativas

**AdminDashboard** (`/frontend/src/pages/admin/Dashboard.tsx`)
- Dashboard principal do admin com links para gerenciamento
- Cartões informativos sobre planos e funcionalidades

**AdminPlans** (`/frontend/src/pages/admin/Plans.tsx`)
- Página de gerenciamento de planos
- Integração com PlanForm e PlansList
- Resumo de planos ativos/inativos

**AdminFeatures** (`/frontend/src/pages/admin/Features.tsx`)
- Página de gerenciamento de funcionalidades
- Integração com FeatureForm e FeaturesList
- Resumo de funcionalidades criadas

#### Componentes

**PlanForm** (`/frontend/src/components/admin/PlanForm.tsx`)
- Formulário para criar/editar planos
- Campos: nome, descrição, preço, intervalo, duração, limites
- Seleção múltipla de features via checkboxes
- Validação de erros do servidor

**PlansList** (`/frontend/src/components/admin/PlansList.tsx`)
- Tabela com todos os planos
- Ações: editar, deletar
- Exibição de status (ativo/inativo)
- Formatação de preços em BRL

**FeatureForm** (`/frontend/src/components/admin/FeatureForm.tsx`)
- Formulário para criar/editar features
- Campos: key, label, descrição, ordem
- Key não pode ser editada após criação

**FeaturesList** (`/frontend/src/components/admin/FeaturesList.tsx`)
- Tabela com todas as features
- Ações: editar, deletar
- Exibição de key em formato monospace

#### Tipos (`/frontend/src/lib/types.ts`)
```typescript
type Feature = {
  id: number;
  key: string;
  label: string;
  description?: string;
  sort_order?: number;
}

type Plan = {
  id: number;
  name: string;
  description: string;
  price_cents: number;
  formatted_price?: string;
  duration_days: number;
  interval: string;
  active: boolean;
  max_songs: number;
  max_setlists: number;
  max_collaborators?: number;
  features?: Feature[];
  // ... outros campos
}
```

#### Roteamento (frontend/src/App.tsx)
```typescript
<Route path="/admin" element={<AdminDashboard />} />
<Route path="/admin/plans" element={<AdminPlans />} />
<Route path="/admin/features" element={<AdminFeatures />} />
```

## Como Usar

### 1. Acessar Interface Admin

1. Faça login como usuário com role `admin`
2. Acesse `/admin` no navegador
3. Você verá o dashboard com links para Planos e Funcionalidades

### 2. Gerenciar Funcionalidades

#### Criar Feature
1. Acesse `/admin/features`
2. Clique em "Nova Funcionalidade"
3. Preencha:
   - **Chave** (ex: `export_pdf`) - único identificador, não pode ser alterado
   - **Nome** (ex: "Exportação em PDF")
   - **Descrição** (opcional, mostrada aos usuários)
   - **Ordem** (número para ordenação na UI)
4. Clique em "Criar Funcionalidade"

#### Editar Feature
1. Na lista, clique no botão "Editar"
2. Modifique nome, descrição ou ordem (não pode modificar key)
3. Clique em "Atualizar Funcionalidade"

#### Deletar Feature
1. Na lista, clique em "Deletar"
2. Confirme a exclusão

### 3. Gerenciar Planos

#### Criar Plano
1. Acesse `/admin/plans`
2. Clique em "Novo Plano"
3. Preencha os dados:
   - **Nome** (ex: "Pro Monthly")
   - **Preço** (em centavos, ex: 999 = R$ 9.99)
   - **Intervalo** (Mês, Ano ou Uma Vez)
   - **Duração** (30 para mensal, 365 para anual)
   - **Máximo de Músicas** (limite de músicas no plano)
   - **Máximo de Setlists** (limite de setlists)
   - **Máximo de Colaboradores** (limite de users na biblioteca)
   - **Ordem** (para ordenação visual)
   - **Funcionalidades** (selecione quais features incluir)
   - **Ativo** (checkbox para ativar/desativar)
4. Clique em "Criar Plano"

#### Editar Plano
1. Na lista, clique em "Editar"
2. Modifique os dados desejados
3. Você pode adicionar/remover features
4. Clique em "Atualizar Plano"

#### Ativar/Desativar Plano
1. Na lista, observe o status na coluna "Status"
2. Para alternar: clique em "Editar", marque/desmarque "Ativo" e salve

#### Deletar Plano
1. Na lista, clique em "Deletar"
2. Confirme a exclusão

### 4. Estrutura de Dados

#### Planos Padrão (Seeds)
```
Free (Grátis)
- R$ 0
- 30 dias
- 50 músicas, 1 setlist
- Sem features

Pro Monthly (Pro Mensal)
- R$ 9.99
- 30 dias
- 500 músicas, 20 setlists
- Features: exportação PDF, app mobile

Pro Annual (Pro Anual)
- R$ 99.99
- 365 dias
- 500 músicas, 20 setlists
- Features: exportação PDF, app mobile

Premium Monthly (Premium Mensal)
- R$ 29.99
- 30 dias
- Ilimitadas músicas, ilimitadas setlists
- Features: todas (6)

Premium Annual (Premium Anual)
- R$ 299.99
- 365 dias
- Ilimitadas músicas, ilimitadas setlists
- Features: todas (6)
```

#### Features Padrão (Seeds)
1. `export_pdf` - Exportação em PDF
2. `mobile_app_access` - Acesso ao app mobile
3. `team_management` - Gerenciamento de equipes
4. `advanced_analytics` - Análise avançada
5. `priority_support` - Suporte prioritário
6. `api_access` - Acesso a API

## Autorização

Todos os endpoints administrativos requerem:
1. **Autenticação**: usuário logado (`authenticate_user!`)
2. **Role de Admin**: `current_user.admin? == true` (`ensure_admin!`)

Exemplo de requisição:
```bash
GET /api/admin/plans
Authorization: Bearer <token>
# Verifica se current_user.admin? == true
```

## Integração com Sistema

### Features Enforcer
As features criadas no admin são automaticamente aplicáveis via `Features::Enforcer`:

```ruby
# No controller ou serviço
enforcer = current_user.feature_enforcer
enforcer.check!('export_pdf') # Levanta erro se não tem acesso

# Ou verificar silenciosamente
if enforcer.check('export_pdf')
  # Usa feature
end
```

### Subscription Renewal
Quando plano é renovado, automaticamente as features do novo plano são disponibilizadas via `SubscriptionRenewalJob`.

## API Request Examples

### Criar Feature
```bash
POST /api/admin/features
Content-Type: application/json

{
  "feature": {
    "key": "new_feature",
    "label": "Nova Funcionalidade",
    "description": "Descrição da nova feature",
    "sort_order": 7
  }
}
```

### Criar Plano com Features
```bash
POST /api/admin/plans
Content-Type: application/json

{
  "plan": {
    "name": "Pro Plus",
    "description": "Plano Pro com extras",
    "price_cents": 1999,
    "interval": "month",
    "duration_days": 30,
    "max_songs": 1000,
    "max_setlists": 50,
    "max_collaborators": 5,
    "sort_order": 2,
    "active": true,
    "feature_ids": [1, 2, 4]
  }
}
```

### Atualizar Features do Plano
```bash
PATCH /api/admin/plans/1/update_features
Content-Type: application/json

{
  "feature_ids": [1, 2, 3, 4, 5]
}
```

## Troubleshooting

### "Unauthorized" ao acessar admin
- Verifique se usuário tem `admin? == true`
- Faça logout e login novamente
- Verifique token JWT/cookie

### Features não aparecem no plano
- Verifique se features foram criadas primeiro
- Reload da página (F5)
- Verifique console do navegador para erros

### Plano não salva
- Verifique erros de validação no formulário
- Confirme CSRF token está presente
- Verifique console do navegador

## Próximos Passos

1. **Stripe Integration** - Integração com pagamentos reais
2. **Feature Limits** - Limites aplicados em validators (ex: máximo de músicas)
3. **Trial Periods** - Períodos de teste gratuitos
4. **Discount Codes** - Código de desconto
5. **Usage Stats** - Dashboard de uso por plano

## Documentação Relacionada

- [BILLING_PLANS_IMPLEMENTATION.md](../BILLING_PLANS_IMPLEMENTATION.md) - Implementação de planos
- [BILLING_TESTS.md](../BILLING_TESTS.md) - Testes de faturamento
- [FEATURE_FLAGS_USAGE.md](../FEATURE_FLAGS_USAGE.md) - Uso de feature flags
