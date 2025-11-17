# Sistema de Cobrança Recorrente

## Visão Geral

O sistema de cobrança recorrente é gerenciado automaticamente pelo **Stripe Subscriptions**. Quando o usuário faz a primeira assinatura, o Stripe cria uma subscription que será renovada automaticamente conforme o intervalo configurado (mensal ou anual).

## Como Funciona

### 1. Primeira Assinatura

```
Usuário → Checkout → Stripe processa → Webhook ativa → Assinatura criada
```

Quando o usuário completa o checkout:
- Stripe cria uma **subscription** (não apenas um pagamento único)
- A subscription é configurada com `recurring: { interval: 'month' }` ou `interval: 'year'`
- O Stripe guarda o método de pagamento do cliente
- Webhook `checkout.session.completed` ativa a assinatura no sistema

### 2. Renovação Automática

**O Stripe gerencia isso automaticamente:**

```
Dia de vencimento → Stripe tenta cobrar → Sucesso → Webhook notifica → Sistema renova
```

**Exemplo:**
- Usuário assina em **17/11/2025** (plano mensal R$ 4,99)
- Stripe automaticamente cobrará em **17/12/2025**
- Stripe automaticamente cobrará em **17/01/2026**
- E assim por diante...

### 3. Webhooks de Renovação

O sistema já está preparado para receber webhooks de renovação:

```ruby
# app/controllers/webhooks/stripe_controller.rb

# Quando pagamento é bem-sucedido (renovação)
def handle_payment_succeeded(invoice)
  subscription = UserSubscription.find_by(
    external_subscription_id: invoice.subscription
  )
  
  # Atualizar data de expiração
  new_expiration = calculate_expiration(subscription.plan.interval)
  subscription.update!(
    status: 'active',
    expires_at: new_expiration
  )
  
  # Enviar email de confirmação
  UserMailer.payment_succeeded(subscription.user, subscription).deliver_later
end
```

## Tipos de Webhooks de Renovação

### ✅ `invoice.payment_succeeded`
**Quando:** Pagamento da renovação é bem-sucedido
**Ação:** Renovar assinatura, atualizar expires_at, enviar email

```ruby
# Exemplo de resposta
{
  "id": "in_1ABC123",
  "object": "invoice",
  "amount_paid": 499,
  "subscription": "sub_1XYZ789",
  "customer": "cus_ABC123",
  "status": "paid",
  "billing_reason": "subscription_cycle" # Indica renovação
}
```

### ❌ `invoice.payment_failed`
**Quando:** Falha na cobrança (cartão recusado, sem fundos, expirado)
**Ação:** Notificar usuário, dar prazo para atualizar

```ruby
def handle_payment_failed(invoice)
  subscription = UserSubscription.find_by(
    external_subscription_id: invoice.subscription
  )
  
  # Enviar email urgente
  UserMailer.payment_failed(subscription.user, subscription).deliver_later
  
  # Opcional: marcar como "at_risk"
  subscription.update(status: 'payment_failed')
end
```

### 🔄 `customer.subscription.updated`
**Quando:** Status da subscription muda
**Ação:** Sincronizar status com Stripe

```ruby
def handle_subscription_updated(stripe_subscription)
  subscription = UserSubscription.find_by(
    external_subscription_id: stripe_subscription.id
  )
  
  # Mapear status do Stripe
  new_status = case stripe_subscription.status
  when 'active', 'trialing'
    'active'
  when 'past_due'
    'payment_failed' # Ainda tentando cobrar
  when 'unpaid'
    'expired' # Stripe desistiu
  when 'canceled'
    'cancelled'
  end
  
  subscription.update!(status: new_status)
end
```

## Ciclo de Vida Completo

### Mês 1 - Primeira Cobrança
```
17/11/2025 - Usuário assina (R$ 4,99)
  ↓
Stripe processa imediatamente
  ↓
Webhook: checkout.session.completed
  ↓
Sistema cria UserSubscription
  status: 'active'
  expires_at: 17/12/2025
  external_subscription_id: 'sub_123'
```

### Mês 2 - Primeira Renovação
```
17/12/2025 - Stripe cobra automaticamente
  ↓
Cartão aprovado
  ↓
Webhook: invoice.payment_succeeded
  ↓
Sistema atualiza UserSubscription
  status: 'active'
  expires_at: 17/01/2026
```

### Mês 3 - Falha de Pagamento
```
17/01/2026 - Stripe tenta cobrar
  ↓
Cartão recusado (sem fundos)
  ↓
Webhook: invoice.payment_failed
  ↓
Sistema notifica usuário
  status: 'payment_failed'
  
Stripe tenta novamente em 3 dias
Stripe tenta novamente em 5 dias
Stripe tenta novamente em 7 dias
  ↓
Se todas falharem:
  ↓
Webhook: customer.subscription.deleted
  ↓
Sistema cancela assinatura
  status: 'cancelled'
```

## Configuração de Retry

Por padrão, o Stripe tem configuração de retry inteligente:

```
Tentativa 1: Dia do vencimento
Tentativa 2: +3 dias
Tentativa 3: +5 dias
Tentativa 4: +7 dias

Total: 15 dias de tentativas
```

Você pode configurar no Dashboard do Stripe:
- Número de tentativas
- Intervalo entre tentativas
- Email automático de lembrete
- Cancelamento automático ou manual

## Implementação no Sistema

### 1. Service para Verificar Status

```ruby
# app/services/subscription_status_checker.rb
class SubscriptionStatusChecker
  def self.sync_all
    UserSubscription.where(payment_provider: 'stripe')
                   .where.not(external_subscription_id: nil)
                   .find_each do |subscription|
      sync_subscription(subscription)
    end
  end
  
  def self.sync_subscription(subscription)
    stripe_sub = Stripe::Subscription.retrieve(
      subscription.external_subscription_id
    )
    
    subscription.update!(
      status: map_stripe_status(stripe_sub.status),
      expires_at: Time.at(stripe_sub.current_period_end)
    )
  rescue Stripe::InvalidRequestError => e
    Rails.logger.error "Subscription not found: #{e.message}"
    subscription.cancel! if subscription.active?
  end
  
  private
  
  def self.map_stripe_status(stripe_status)
    case stripe_status
    when 'active', 'trialing' then 'active'
    when 'past_due' then 'payment_failed'
    when 'canceled', 'unpaid' then 'cancelled'
    else 'expired'
    end
  end
end
```

### 2. Rake Task para Sincronização Diária

```ruby
# lib/tasks/subscriptions.rake
namespace :subscriptions do
  desc "Sync subscription status with Stripe"
  task sync: :environment do
    puts "Syncing subscriptions with Stripe..."
    SubscriptionStatusChecker.sync_all
    puts "Done!"
  end
  
  desc "Send expiration warnings"
  task warn_expiring: :environment do
    # Avisar assinaturas que expiram em 3 dias
    UserSubscription.active
                    .where('expires_at <= ?', 3.days.from_now)
                    .find_each do |subscription|
      UserMailer.expiring_soon(subscription.user, subscription).deliver_later
    end
  end
end
```

### 3. Agendar com Solid Queue

```yaml
# config/recurring.yml
sync_subscriptions:
  cron: "0 2 * * *"  # Todo dia às 2h da manhã
  class: "SubscriptionSyncJob"
  
warn_expiring:
  cron: "0 9 * * *"  # Todo dia às 9h
  class: "ExpiringSubscriptionsJob"
```

```ruby
# app/jobs/subscription_sync_job.rb
class SubscriptionSyncJob < ApplicationJob
  queue_as :default

  def perform
    SubscriptionStatusChecker.sync_all
  end
end

# app/jobs/expiring_subscriptions_job.rb
class ExpiringSubscriptionsJob < ApplicationJob
  queue_as :default

  def perform
    UserSubscription.active
                    .where('expires_at <= ?', 3.days.from_now)
                    .find_each do |subscription|
      UserMailer.expiring_soon(subscription.user, subscription).deliver_later
    end
  end
end
```

## Casos Especiais

### 1. Upgrade/Downgrade Mid-Cycle

Quando usuário muda de plano no meio do mês:

```ruby
# app/services/subscription_change_service.rb
class SubscriptionChangeService
  def initialize(user, new_plan)
    @user = user
    @new_plan = new_plan
    @current_subscription = user.active_subscription
  end

  def change_plan
    return create_new_subscription unless @current_subscription&.external_subscription_id

    # Atualizar subscription no Stripe
    stripe_subscription = Stripe::Subscription.retrieve(
      @current_subscription.external_subscription_id
    )

    # Atualizar com proration (Stripe calcula automaticamente)
    Stripe::Subscription.update(
      stripe_subscription.id,
      {
        items: [{
          id: stripe_subscription.items.data[0].id,
          price: @new_plan.external_price_id,
        }],
        proration_behavior: 'create_prorations' # Calcula proporcional
      }
    )

    # Atualizar no banco
    @current_subscription.update!(
      plan: @new_plan,
      expires_at: Time.at(stripe_subscription.current_period_end)
    )
  end

  private

  def create_new_subscription
    # Criar nova subscription no Stripe
    # (código do checkout_service)
  end
end
```

### 2. Cancelamento

Quando usuário cancela:

```ruby
# app/controllers/api/subscriptions_controller.rb
def cancel
  subscription = current_user.active_subscription
  
  # Cancelar no Stripe (fim do período atual)
  Stripe::Subscription.update(
    subscription.external_subscription_id,
    cancel_at_period_end: true # Não cancela imediatamente
  )
  
  # Usuário continua tendo acesso até expires_at
  subscription.update!(cancelled_at: Time.current)
  
  render json: {
    message: 'Assinatura cancelada. Você terá acesso até ' + 
             subscription.expires_at.strftime('%d/%m/%Y')
  }
end
```

### 3. Reativar Assinatura Cancelada

```ruby
def reactivate
  subscription = current_user.user_subscriptions
                            .where(status: 'cancelled')
                            .order(created_at: :desc)
                            .first
  
  if subscription&.external_subscription_id
    # Reativar no Stripe
    Stripe::Subscription.update(
      subscription.external_subscription_id,
      cancel_at_period_end: false
    )
    
    subscription.update!(
      status: 'active',
      cancelled_at: nil
    )
    
    render json: { message: 'Assinatura reativada!' }
  else
    render json: { error: 'Nenhuma assinatura para reativar' }, 
           status: :not_found
  end
end
```

## Monitoramento e Alertas

### 1. Dashboard de Métricas

```ruby
# app/controllers/api/admin/subscription_metrics_controller.rb
def index
  render json: {
    active_subscriptions: UserSubscription.active.count,
    monthly_revenue: calculate_monthly_revenue,
    churn_rate: calculate_churn_rate,
    failed_payments_last_30_days: failed_payments_count,
    upcoming_renewals: upcoming_renewals_count
  }
end

private

def calculate_monthly_revenue
  UserSubscription.active.joins(:plan).sum('plans.price_cents') / 100.0
end

def calculate_churn_rate
  cancelled_this_month = UserSubscription.where(
    'cancelled_at >= ?', 1.month.ago
  ).count
  
  total_last_month = UserSubscription.where(
    'created_at < ?', 1.month.ago
  ).count
  
  return 0 if total_last_month.zero?
  (cancelled_this_month.to_f / total_last_month * 100).round(2)
end
```

### 2. Alertas Automáticos

```ruby
# app/services/subscription_alert_service.rb
class SubscriptionAlertService
  def self.check_and_alert
    # Muitas falhas de pagamento
    failed_count = UserSubscription.where(
      status: 'payment_failed',
      updated_at: (1.day.ago..Time.current)
    ).count
    
    if failed_count > 10
      AdminMailer.high_failure_rate(failed_count).deliver_now
    end
    
    # Churn alto
    churn = calculate_churn_rate
    if churn > 10
      AdminMailer.high_churn_alert(churn).deliver_now
    end
  end
end
```

## Emails Transacionais

### Templates Necessários

1. **Confirmação de Assinatura** (primeira vez)
2. **Pagamento Bem-Sucedido** (renovação)
3. **Falha no Pagamento** (urgente)
4. **Último Aviso** (antes de cancelar)
5. **Assinatura Cancelada**
6. **Expirando em 3 dias**

```ruby
# app/mailers/subscription_mailer.rb
class SubscriptionMailer < ApplicationMailer
  def payment_succeeded(user, subscription)
    @user = user
    @subscription = subscription
    @amount = subscription.plan.formatted_price
    
    mail(
      to: user.email,
      subject: '✅ Pagamento confirmado - ChordKeeper'
    )
  end
  
  def payment_failed(user, subscription)
    @user = user
    @subscription = subscription
    @update_payment_url = "#{ENV['FRONTEND_URL']}/billing"
    
    mail(
      to: user.email,
      subject: '⚠️ Falha no pagamento - Ação necessária'
    )
  end
  
  def expiring_soon(user, subscription)
    @user = user
    @subscription = subscription
    @days_remaining = subscription.days_remaining
    
    mail(
      to: user.email,
      subject: "Sua assinatura expira em #{@days_remaining} dias"
    )
  end
end
```

## Testes

### RSpec para Webhooks

```ruby
# spec/requests/webhooks/stripe_spec.rb
RSpec.describe "Webhooks::Stripe", type: :request do
  describe "POST /webhooks/stripe" do
    context "with valid signature" do
      it "renews subscription on payment_succeeded" do
        user = create(:user)
        plan = create(:plan, interval: 'month')
        subscription = create(:user_subscription, 
          user: user, 
          plan: plan,
          external_subscription_id: 'sub_123'
        )
        
        event = build_stripe_event('invoice.payment_succeeded', {
          subscription: 'sub_123'
        })
        
        post '/webhooks/stripe', 
          params: event.to_json,
          headers: stripe_headers
        
        expect(response).to have_http_status(:ok)
        expect(subscription.reload.expires_at).to be > Time.current
      end
    end
  end
end
```

## Resumo

### ✅ O que o Stripe faz automaticamente:
- Cobra o cartão mensalmente/anualmente
- Tenta novamente em caso de falha (com retry inteligente)
- Gerencia o ciclo de vida da subscription
- Calcula proration em upgrades
- Envia notificações por email (opcional)

### ✅ O que nosso sistema faz:
- Recebe webhooks do Stripe
- Atualiza status local da assinatura
- Renova `expires_at`
- Envia emails personalizados
- Sincroniza diariamente (backup)
- Monitora métricas e alertas

### 🎯 Próximos Passos:
1. Implementar emails transacionais
2. Configurar Solid Queue para jobs recorrentes
3. Dashboard de métricas de assinatura
4. Customer Portal para usuário gerenciar cartão
5. Testes automatizados de webhooks

**A cobrança recorrente funciona 100% automaticamente pelo Stripe!** O sistema só precisa receber os webhooks e manter os dados sincronizados.
