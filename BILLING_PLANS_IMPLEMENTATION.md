# Implementação de Planos de Cobrança Recorrente

## Resumo das Mudanças

Implementação completa de planos de cobrança mensal e anual com seleção pelo cliente, renovação automática e UI melhorada.

## 1. Planos Criados (Seeds)

Arquivo: `db/seeds.rb`

5 planos foram criados:
1. **Free** - Gratuito (sem expiração)
   - 50 músicas, 1 setlist, sem colaboradores

2. **Pro (Mensal)** - R$ 9,99/mês
   - Músicas/setlists/colaboradores: 999/999/10
   - 30 dias de duração

3. **Pro Annual** - R$ 99,99/ano (20% desconto)
   - Mesmos recursos que Pro Mensal
   - 365 dias de duração

4. **Premium (Mensal)** - R$ 29,99/mês
   - Colaboradores ilimitados (999)
   - Gerenciamento de equipe e analytics

5. **Premium Annual** - R$ 299,99/ano (20% desconto)
   - Mesmos recursos que Premium Mensal

## 2. Banco de Dados

### Novas Migrações

**Migração 1: `db/migrate/20260415120200_add_auto_renew_to_user_subscriptions.rb`**

Campos adicionados à tabela `user_subscriptions`:
- `auto_renew` (boolean, padrão: true) - Ativa renovação automática
- `last_renewed_at` (datetime) - Data da última renovação
- `provider_customer_id` (string) - ID do cliente no provedor de pagamento

**Migração 2: `db/migrate/20260415120300_add_feature_flags_to_plans.rb`**

Cria duas novas tabelas para gerenciar features:

- **features** (nova tabela)
  - `id` (primary key)
  - `key` (string, unique) - Identificador da feature
  - `label` (string) - Nome exibível
  - `description` (text) - Descrição
  - `sort_order` (integer) - Ordem de exibição

- **plan_features** (tabela junction M-to-M)
  - `plan_id` (foreign key)
  - `feature_id` (foreign key)
  - Índice único: [plan_id, feature_id]

### Estrutura Relacional

```
Plans (1) ──── (M) PlanFeatures (M) ──── (1) Features
```

Cada plano pode ter múltiplas features, e cada feature pode estar em múltiplos planos.

## 3. Backend - Services

### Novo Serviço: RenewalService
Arquivo: `app/services/subscriptions/renewal_service.rb`

```ruby
# Uso:
subscription = user.current_subscription
Subscriptions::RenewalService.new.call(subscription)
```

Responsabilidades:
- Processar pagamento via provedor
- Atualizar data de expiração (+duration_days)
- Criar notificação de renovação bem-sucedida
- Tratar erros de pagamento

## 4. Backend - Jobs

### Novo Job: SubscriptionRenewalJob
Arquivo: `app/jobs/subscription_renewal_job.rb`

Executa diariamente (configurado em `config/recurring.yml`)
- Encontra assinaturas expiradas com `auto_renew: true`
- Tenta renovar cada uma
- Loga erros sem parar o processamento

### Configuração
Arquivo: `config/recurring.yml`

```yaml
subscription_renewal:
  class: SubscriptionRenewalJob
  queue: default
  schedule: every day at 10am
```

## 4. Backend - Models

### Plan Model (Atualizado)
Arquivo: `app/models/plan.rb`

```ruby
class Plan < ApplicationRecord
  has_many :plan_features, dependent: :destroy
  has_many :features, through: :plan_features

  # Métodos
  plan.has_feature?(:export_pdf)           # => true/false
  plan.add_feature(:export_pdf)            # => true
  plan.remove_feature(:export_pdf)         # => true
  plan.features_list                       # => [{key, label, enabled: true}, ...]
end
```

### Feature Model (Novo)
Arquivo: `app/models/feature.rb`

```ruby
class Feature < ApplicationRecord
  has_many :plan_features, dependent: :destroy
  has_many :plans, through: :plan_features

  # Métodos
  Feature.find_by_key(:export_pdf)         # => Feature object
  Feature.ordered                          # => [Feature, Feature, ...]
end
```

### PlanFeature Model (Novo)
Arquivo: `app/models/plan_feature.rb`

Associação M-to-M entre Plans e Features.

### Features::Enforcer Service (Atualizado)
Arquivo: `app/services/features/enforcer.rb`

```ruby
enforcer = user.feature_enforcer

enforcer.check(:export_pdf)                # => true/false
enforcer.check!(:export_pdf)               # => error se não permitido
enforcer.enabled_features                  # => [:export_pdf, :mobile_app_access]
enforcer.feature_label(:export_pdf)        # => "Exportar para PDF"
enforcer.all_features                      # => [Feature, Feature, ...]
```

## 6. Frontend - Componente PlanComparison

Arquivo: `frontend/src/components/billing/PlanComparison.tsx`

### Features:
- **Toggle Mensal/Anual** - Selecione o período de cobrança
- **Comparação Visual** - Cards lado a lado de cada plano
- **Badge de Economia** - Mostra % de desconto para anual
- **Listagem de Features** - Recursos de cada plano (dinâmico da API)
- **Tabela Comparativa** - Visão detalhada lado a lado
- **Indicador de Plano Atual** - Mostra qual plano o usuário tem

### Propriedades:
```tsx
<PlanComparison
  plans={activePlans}
  selectedPlanId={selectedPlanId}
  onSelectPlan={setSelectedPlanId}
  currentPlanId={subscription?.plan?.id}
  loading={actionLoading}
/>
```

## 7. Frontend - Página Subscription Atualizada

Arquivo: `frontend/src/pages/billing/Subscription.tsx`

Integrado o novo componente `PlanComparison` para melhor UX.

## Fluxo de Uso

### Para o Cliente:

1. **Acessar Página de Assinatura**
   - Navegar até `/billing` ou `/subscription`

2. **Selecionar Período**
   - Clicar em "Mensal" ou "Anual"
   - Planos são filtrados conforme seleção

3. **Comparar Planos**
   - Visualizar preço mensal equivalente
   - Ver economias para planos anuais
   - Ler features de cada plano (carregadas da API)

4. **Selecionar Plano**
   - Clicar no botão "Selecionar"
   - Plano fica destacado

5. **Preencher Dados**
   - Nome, Documento, Telefone
   - Token do cartão (MockProvider para teste)
   - Bandeira e últimos 4 dígitos

6. **Confirmar**
   - Clicar "Assinar plano" (nova assinatura)
   - Ou "Trocar plano" (assinatura existente)

7. **Renovação Automática**
   - Quando expira, o job roda a cada dia
   - Renovação automática se `auto_renew: true`
   - Notificação de sucesso/erro

## Para Testar Localmente

### 1. Executar Migrations
```bash
cd chord-keeper-web
rails db:migrate
```

### 2. Popular Planos
```bash
rails db:seed
```

Confirmação:
```
✓ Created 5 subscription plans
```

### 3. Testar Seleção de Planos
Da interface do frontend, acesse a página de assinatura
e selecione planos mensais vs anuais.

### 4. Testar Renovação (Manual em Dev)

Para testar o job manualmente em desenvolvimento:

```ruby
# No console Rails
job = SubscriptionRenewalJob.new
job.perform

# Ou com Solid Queue:
Solid::Queue::Job.create!(
  class_name: "SubscriptionRenewalJob",
  queue_name: "default",
  scheduled_at: Time.current
)
```

### 5. Verificar Notificações
```ruby
# No console
subscription = UserSubscription.last
subscription.notifications
```

## Campos Importantes para Regras de Negócio

### Plan Model
- `interval` (month/year) - Período
- `duration_days` (30/365) - Duração
- `price_cents` - Preço em centavos
- `max_songs`, `max_setlists`, `max_collaborators` - Limites
- **has_many :features** - Features do plano (via M-to-M)

### Feature Model (Novo)
- `key` (string, unique) - Identificador (ex: export_pdf)
- `label` (string) - Nome exibível (ex: "Exportar para PDF")
- `description` (text) - Descrição detalhada
- `sort_order` (integer) - Ordem de exibição

### PlanFeature Model (Novo)
- Associação M-to-M entre plans e features
- Índice único em [plan_id, feature_id]

### UserSubscription Model
- `auto_renew` - Ativa/desativa renovação automática
- `expires_at` - Data de expiração
- `last_renewed_at` - Última renovação processada
- `provider_customer_id` - ID no gateway de pagamento
- `status` (active/expired/cancelled/renewal_failed) - Status

## Feature Flags (Controle de Funcionalidades - Novo!)

### Estrutura M-to-M
Features são gerenciadas via tabela `features` e relacionadas aos planos através de `plan_features`:

```
6 Features Padrão:
1. export_pdf - Exportar para PDF
2. mobile_app_access - Acesso ao App Mobile
3. team_management - Gerenciamento de Equipe
4. advanced_analytics - Analytics Avançado
5. priority_support - Suporte Prioritário
6. api_access - Acesso à API
```

### Verificar Acesso a Feature

```ruby
user = User.first
enforcer = user.feature_enforcer

# Verificar se pode usar
enforcer.check(:export_pdf)           # => true/false

# Verificar com exceção
enforcer.check!(:export_pdf)          # => true ou lança FeatureNotAllowed

# Obter todas as features
enforcer.enabled_features             # => [:export_pdf, :mobile_app_access, ...]

# Obter label
enforcer.feature_label(:export_pdf)   # => "Exportar para PDF"
```

### Usar em Controllers

```ruby
class SongsController < ApplicationController
  include Concerns::RequiresFeature

  def export_pdf
    require_feature(:export_pdf)  # Lança exceção se não permitido
    # ... continuar com exportação
  end

  def advanced_stats
    if feature_enabled?(:advanced_analytics)
      # ... mostrar analytics avançado
    else
      # ... mostrar analytics básico
    end
  end
end
```

### Usar em Models

```ruby
class Song < ApplicationRecord
  before_create :validate_song_limit

  def validate_song_limit
    owner = library.owner
    plan = owner.current_subscription&.plan
    return if plan.nil?

    current_count = owner.library_users
      .joins(library: :songs)
      .where(library_id: library.id)
      .count

    if current_count >= plan.max_songs
      raise StandardError, "Limite de músicas atingido"
    end
  end
end
```

### Gerenciar Features de um Plano

```ruby
plan = Plan.find_by(name: "Pro")

# Ver features atuais
plan.features.pluck(:label)
# => ["Exportar para PDF", "Acesso ao App Mobile"]

# Adicionar nova feature
plan.add_feature(:team_management)
# => true

# Remover feature
plan.remove_feature(:mobile_app_access)
# => true

# Verificar se tem feature
plan.has_feature?(:export_pdf)
# => true
```

### Adicionar Nova Feature (Admin)

```ruby
# Criar feature
Feature.create!(
  key: "white_label",
  label: "White Label",
  description: "Customizar branding da aplicação",
  sort_order: 7
)

# Associar ao plano
plan = Plan.find_by(name: "Premium")
plan.add_feature(:white_label)
```

**Documentação detalhada:** Ver arquivo `FEATURE_FLAGS_USAGE.md`

## Próximos Passos Recomendados

1. **Integração com Stripe**
   - Implementar `Payments::StripeProvider`
   - Webhook de confirmação de pagamento

2. **Implementar Validações de Feature**
   - Bloquear acesso a PDF export se não permitido
   - Bloquear acesso a API se não permitido
   - Validar limites antes de criar recursos

3. **Auto-downgrade**
   - Se cliente cancela manualmente, downgrade para Free

4. **Email de Renovação**
   - Mailer para confirmar renovação
   - Mailer para falha de renovação

5. **Dashboard Admin**
   - Visualizar subscriptions ativas
   - MRR (Monthly Recurring Revenue)
   - Churn rate
   - Feature usage by plan

## Troubleshooting

### Planos não aparecem na UI
```bash
# Verificar se seeds rodaram
rails db:seed
# Verificar plans
rails c
> Plan.all
> Plan.active
```

### Renovação não está processando
```bash
# Verificar se o job está agendado
Solid::Queue::RecurringExecution.all

# Executar job manualmente
SubscriptionRenewalJob.perform_now

# Verificar logs
tail -f log/development.log
```

### Assinatura não renova
```ruby
# Verificar se auto_renew está true
subscription = UserSubscription.last
subscription.auto_renew # deve ser true
subscription.expires_at # verificar data
```

## Referências
- Planos: `app/models/plan.rb`
- Subscriptions: `app/models/user_subscription.rb`
- Services: `app/services/subscriptions/`
- Jobs: `app/jobs/subscription_*_job.rb`
- UI: `frontend/src/components/billing/`
