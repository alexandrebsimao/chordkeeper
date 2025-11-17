# Integração com Gateway de Pagamento

## Visão Geral

Este documento descreve como integrar o sistema de planos com gateways de pagamento como Stripe, PagSeguro ou Mercado Pago.

## Opções de Gateway

### 1. Stripe (Internacional)
- ✅ Melhor documentação
- ✅ SDKs robustos
- ✅ Webhooks confiáveis
- ✅ Suporte a assinaturas recorrentes
- ❌ Requer cartão internacional

### 2. PagSeguro (Brasil)
- ✅ Aceita cartões brasileiros
- ✅ Boleto bancário
- ✅ PIX
- ❌ Documentação menos completa

### 3. Mercado Pago (América Latina)
- ✅ Aceita cartões locais
- ✅ PIX
- ✅ Boa documentação
- ✅ API moderna

## Arquitetura Proposta

```
┌─────────────┐
│   Frontend  │
│   (React)   │
└──────┬──────┘
       │
       │ 1. Seleciona plano
       ▼
┌─────────────────────────┐
│  Backend (Rails API)    │
│  /api/subscriptions     │
└──────┬──────────────────┘
       │
       │ 2. Cria checkout session
       ▼
┌─────────────────────────┐
│  Gateway de Pagamento   │
│  (Stripe/PagSeguro)     │
└──────┬──────────────────┘
       │
       │ 3. Processa pagamento
       │ 4. Envia webhook
       ▼
┌─────────────────────────┐
│  Webhook Handler        │
│  /webhooks/stripe       │
└──────┬──────────────────┘
       │
       │ 5. Ativa assinatura
       ▼
┌─────────────────────────┐
│   Database              │
│   UserSubscription      │
└─────────────────────────┘
```

## Implementação com Stripe

### 1. Adicionar Gems

```ruby
# Gemfile
gem 'stripe', '~> 10.0'
```

### 2. Configuração

```ruby
# config/initializers/stripe.rb
Stripe.api_key = Rails.application.credentials.dig(:stripe, :secret_key)

STRIPE_WEBHOOK_SECRET = Rails.application.credentials.dig(:stripe, :webhook_secret)
```

```yaml
# config/credentials.yml.enc (editado com: rails credentials:edit)
stripe:
  publishable_key: pk_test_...
  secret_key: sk_test_...
  webhook_secret: whsec_...
```

### 3. Criar produtos no Stripe

```ruby
# lib/tasks/stripe.rake
namespace :stripe do
  desc "Sync plans with Stripe"
  task sync_plans: :environment do
    Plan.find_each do |plan|
      next if plan.external_plan_id.present?
      
      # Criar produto
      product = Stripe::Product.create(
        name: plan.name,
        description: "Plano #{plan.name} do ChordKeeper"
      )
      
      # Criar preço
      price = Stripe::Price.create(
        product: product.id,
        unit_amount: plan.price_cents,
        currency: 'brl',
        recurring: {
          interval: plan.interval == 'month' ? 'month' : 'year'
        }
      )
      
      plan.update!(
        external_plan_id: product.id,
        external_price_id: price.id
      )
      
      puts "Synced plan: #{plan.name}"
    end
  end
end
```

### 4. Migration para campos externos

```ruby
# db/migrate/YYYYMMDDHHMMSS_add_external_ids_to_plans.rb
class AddExternalIdsToPlans < ActiveRecord::Migration[8.0]
  def change
    add_column :plans, :external_plan_id, :string
    add_column :plans, :external_price_id, :string
    
    add_column :user_subscriptions, :external_customer_id, :string
    
    add_index :plans, :external_plan_id
    add_index :user_subscriptions, :external_customer_id
  end
end
```

### 5. Service de Checkout

```ruby
# app/services/stripe_checkout_service.rb
class StripeCheckoutService
  def initialize(user, plan)
    @user = user
    @plan = plan
  end

  def create_checkout_session(success_url:, cancel_url:)
    # Criar ou obter customer
    customer = find_or_create_customer

    # Criar checkout session
    session = Stripe::Checkout::Session.create(
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [{
        price: @plan.external_price_id,
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: success_url,
      cancel_url: cancel_url,
      metadata: {
        user_id: @user.id,
        plan_id: @plan.id
      }
    )

    session
  end

  private

  def find_or_create_customer
    subscription = @user.user_subscriptions.last
    
    if subscription&.external_customer_id
      Stripe::Customer.retrieve(subscription.external_customer_id)
    else
      Stripe::Customer.create(
        email: @user.email,
        metadata: {
          user_id: @user.id
        }
      )
    end
  end
end
```

### 6. Controller de Checkout

```ruby
# app/controllers/api/checkout_controller.rb
module Api
  class CheckoutController < ApiController
    before_action :authenticate_user!

    # POST /api/checkout
    def create
      plan = Plan.find_by(id: params[:plan_id])
      
      unless plan&.active
        return render json: { error: 'Plano não disponível' }, status: :unprocessable_entity
      end

      # Free plan - ativar direto
      if plan.price_cents == 0
        activate_free_plan(plan)
        return
      end

      # Paid plan - criar checkout session
      begin
        service = StripeCheckoutService.new(current_user, plan)
        session = service.create_checkout_session(
          success_url: "#{ENV['FRONTEND_URL']}/checkout/success?session_id={CHECKOUT_SESSION_ID}",
          cancel_url: "#{ENV['FRONTEND_URL']}/plans?canceled=true"
        )

        render json: {
          checkout_url: session.url,
          session_id: session.id
        }, status: :ok
      rescue Stripe::StripeError => e
        render json: { error: e.message }, status: :unprocessable_entity
      end
    end

    # GET /api/checkout/success
    def success
      session_id = params[:session_id]
      
      begin
        session = Stripe::Checkout::Session.retrieve(session_id)
        
        if session.payment_status == 'paid'
          # Webhook já deve ter ativado, mas garantir
          render json: {
            message: 'Pagamento confirmado!',
            status: 'success'
          }, status: :ok
        else
          render json: {
            message: 'Aguardando confirmação do pagamento',
            status: 'pending'
          }, status: :ok
        end
      rescue Stripe::StripeError => e
        render json: { error: e.message }, status: :unprocessable_entity
      end
    end

    private

    def activate_free_plan(plan)
      subscription = current_user.user_subscriptions.create!(
        plan: plan,
        status: 'active',
        started_at: Time.current,
        expires_at: nil, # Free plan nunca expira
        payment_provider: 'free'
      )

      render json: {
        message: 'Plano Free ativado com sucesso',
        subscription: subscription
      }, status: :created
    end
  end
end
```

### 7. Webhook Handler

```ruby
# app/controllers/webhooks/stripe_controller.rb
module Webhooks
  class StripeController < ApplicationController
    skip_before_action :verify_authenticity_token
    before_action :verify_signature

    # POST /webhooks/stripe
    def create
      event = @stripe_event

      case event.type
      when 'checkout.session.completed'
        handle_checkout_completed(event.data.object)
      when 'customer.subscription.created'
        handle_subscription_created(event.data.object)
      when 'customer.subscription.updated'
        handle_subscription_updated(event.data.object)
      when 'customer.subscription.deleted'
        handle_subscription_deleted(event.data.object)
      when 'invoice.payment_succeeded'
        handle_payment_succeeded(event.data.object)
      when 'invoice.payment_failed'
        handle_payment_failed(event.data.object)
      end

      head :ok
    end

    private

    def verify_signature
      payload = request.body.read
      sig_header = request.headers['Stripe-Signature']

      begin
        @stripe_event = Stripe::Webhook.construct_event(
          payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
      rescue JSON::ParserError, Stripe::SignatureVerificationError => e
        render json: { error: e.message }, status: :bad_request
      end
    end

    def handle_checkout_completed(session)
      user_id = session.metadata.user_id
      plan_id = session.metadata.plan_id
      
      user = User.find(user_id)
      plan = Plan.find(plan_id)
      
      subscription = user.user_subscriptions.create!(
        plan: plan,
        status: 'active',
        started_at: Time.current,
        expires_at: calculate_expiration(plan.interval),
        payment_provider: 'stripe',
        external_subscription_id: session.subscription,
        external_customer_id: session.customer
      )

      # Enviar email de boas-vindas
      UserMailer.subscription_activated(user, subscription).deliver_later

      Rails.logger.info "Subscription created for user #{user.id}"
    end

    def handle_subscription_created(stripe_subscription)
      subscription = UserSubscription.find_by(external_subscription_id: stripe_subscription.id)
      return unless subscription

      subscription.update!(status: 'active')
    end

    def handle_subscription_updated(stripe_subscription)
      subscription = UserSubscription.find_by(external_subscription_id: stripe_subscription.id)
      return unless subscription

      # Atualizar status baseado no Stripe
      new_status = case stripe_subscription.status
      when 'active', 'trialing'
        'active'
      when 'canceled'
        'cancelled'
      when 'past_due', 'unpaid'
        'expired'
      else
        subscription.status
      end

      subscription.update!(status: new_status)
    end

    def handle_subscription_deleted(stripe_subscription)
      subscription = UserSubscription.find_by(external_subscription_id: stripe_subscription.id)
      return unless subscription

      subscription.cancel!
      
      # Enviar email de cancelamento
      UserMailer.subscription_cancelled(subscription.user, subscription).deliver_later
    end

    def handle_payment_succeeded(invoice)
      subscription_id = invoice.subscription
      subscription = UserSubscription.find_by(external_subscription_id: subscription_id)
      return unless subscription

      # Renovar assinatura
      new_expiration = calculate_expiration(subscription.plan.interval)
      subscription.renew!(expires_at: new_expiration)

      # Enviar email de confirmação
      UserMailer.payment_succeeded(subscription.user, subscription).deliver_later
    end

    def handle_payment_failed(invoice)
      subscription_id = invoice.subscription
      subscription = UserSubscription.find_by(external_subscription_id: subscription_id)
      return unless subscription

      # Enviar email de falha
      UserMailer.payment_failed(subscription.user, subscription).deliver_later
    end

    def calculate_expiration(interval)
      case interval
      when 'month'
        1.month.from_now
      when 'year'
        1.year.from_now
      end
    end
  end
end
```

### 8. Rotas do Webhook

```ruby
# config/routes.rb
Rails.application.routes.draw do
  # Webhooks (fora do namespace api)
  namespace :webhooks do
    post 'stripe', to: 'stripe#create'
  end

  namespace :api do
    # Checkout
    post 'checkout', to: 'checkout#create'
    get 'checkout/success', to: 'checkout#success'
    
    # ... outras rotas
  end
end
```

### 9. Frontend - Página de Checkout

```tsx
// frontend/src/pages/Plans.tsx - Atualizar handleSubscribe

const handleSubscribe = async (planId: number) => {
  setSubscribing(planId);
  
  try {
    const response = await fetchWithAuth('/api/checkout', {
      method: 'POST',
      body: JSON.stringify({ plan_id: planId }),
    });

    const data = await response.json();

    if (response.ok) {
      if (data.checkout_url) {
        // Redirecionar para Stripe Checkout
        window.location.href = data.checkout_url;
      } else {
        // Plano free ativado direto
        toast({
          title: 'Sucesso!',
          description: 'Plano ativado com sucesso',
        });
        await refetchUserPlan();
        navigate('/songs');
      }
    } else {
      throw new Error(data.error || 'Failed to subscribe');
    }
  } catch (error) {
    console.error('Error subscribing:', error);
    toast({
      title: 'Erro',
      description: 'Não foi possível processar o pagamento',
      variant: 'destructive',
    });
  } finally {
    setSubscribing(null);
  }
};
```

### 10. Página de Sucesso

```tsx
// frontend/src/pages/checkout/Success.tsx
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';
import { fetchWithAuth } from '@/lib/auth';

export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (sessionId) {
      verifyPayment();
    }
  }, [sessionId]);

  const verifyPayment = async () => {
    try {
      const response = await fetchWithAuth(`/api/checkout/success?session_id=${sessionId}`);
      const data = await response.json();

      if (response.ok) {
        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch (error) {
      setStatus('error');
    }
  };

  if (status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-16 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
          <p>Verificando pagamento...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-red-600">Erro ao processar pagamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>Houve um problema ao verificar seu pagamento. Por favor, entre em contato com o suporte.</p>
            <Button onClick={() => navigate('/plans')} className="w-full">
              Voltar para Planos
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="rounded-full bg-green-100 p-4">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-center">Pagamento Confirmado!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-muted-foreground">
            Seu plano foi ativado com sucesso. Agora você tem acesso a todos os recursos!
          </p>
          <Button onClick={() => navigate('/songs')} className="w-full">
            Começar a usar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

### 11. Variáveis de Ambiente

```bash
# .env
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=http://localhost:5173
```

### 12. Customer Portal (Gerenciar Assinatura)

```ruby
# app/controllers/api/billing_portal_controller.rb
module Api
  class BillingPortalController < ApiController
    before_action :authenticate_user!

    # POST /api/billing_portal
    def create
      subscription = current_user.active_subscription
      
      unless subscription&.external_customer_id
        return render json: { error: 'Nenhuma assinatura ativa' }, status: :not_found
      end

      begin
        session = Stripe::BillingPortal::Session.create(
          customer: subscription.external_customer_id,
          return_url: "#{ENV['FRONTEND_URL']}/plans"
        )

        render json: { portal_url: session.url }, status: :ok
      rescue Stripe::StripeError => e
        render json: { error: e.message }, status: :unprocessable_entity
      end
    end
  end
end
```

```tsx
// Botão para acessar portal
const handleManageSubscription = async () => {
  const response = await fetchWithAuth('/api/billing_portal', {
    method: 'POST',
  });
  
  const data = await response.json();
  if (data.portal_url) {
    window.location.href = data.portal_url;
  }
};
```

## Testando

### 1. Modo de Teste Stripe

Use cartões de teste:
- Sucesso: `4242 4242 4242 4242`
- Falha: `4000 0000 0000 0002`
- 3D Secure: `4000 0027 6000 3184`

### 2. Testar Webhooks Localmente

```bash
# Instalar Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

#Forward webhooks
stripe listen --forward-to localhost:3000/webhooks/stripe

# Trigger evento de teste
stripe trigger checkout.session.completed
```

## Monitoramento

### 1. Logs
```ruby
# app/models/webhook_log.rb
class WebhookLog < ApplicationRecord
  # Guardar todos os webhooks recebidos
end
```

### 2. Dashboard Stripe
- Ver todas as assinaturas
- Cancelamentos
- Pagamentos falhados
- Reembolsos

## Segurança

1. ✅ Sempre verificar assinatura do webhook
2. ✅ Usar HTTPS em produção
3. ✅ Guardar keys em credentials criptografadas
4. ✅ Validar user_id dos metadados
5. ✅ Implementar idempotência nos webhooks

## Próximos Passos

1. Implementar trial period (7 dias grátis)
2. Cupons de desconto
3. Upgrade/downgrade com proration
4. Múltiplos métodos de pagamento (PIX, Boleto)
5. Analytics de conversão
