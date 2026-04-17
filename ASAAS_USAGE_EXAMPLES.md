# AsaasProvider - Exemplos Práticos de Uso

## 1. Criar Assinatura com Cartão de Crédito

```ruby
# app/controllers/api/subscriptions_controller.rb
class Api::SubscriptionsController < Api::ApiController
  def create
    user = current_user
    plan = Plan.find(params[:plan_id])
    
    payment_data = {
      method: 'credit_card',
      number: params[:card_number],
      expiry_month: params[:expiry_month],
      expiry_year: params[:expiry_year],
      ccv: params[:ccv],
      holder_name: params[:cardholder_name],
      brand: 'visa', # detectado automaticamente
      last4: params[:card_number][-4..-1]
    }
    
    customer_data = {
      name: params[:customer_name],
      document: params[:cpf],
      phone: params[:phone]
    }
    
    # Serviço já existente usa AsaasProvider:
    subscription = Subscriptions::CreateService.call(
      user: user,
      plan: plan,
      payment_data: payment_data,
      customer_data: customer_data
    )
    
    render json: subscription, status: :created
  rescue Payments::AsaasAPIError => e
    render json: { error: e.message }, status: :unprocessable_entity
  end
end
```

## 2. Atualizar Método de Pagamento

```ruby
# Frontend envia novo cartão
class Api::SubscriptionsController < Api::ApiController
  def update_payment_method
    subscription = current_user.current_subscription
    
    payment_data = {
      method: 'credit_card',
      number: params[:card_number],
      expiry_month: params[:expiry_month],
      expiry_year: params[:expiry_year],
      ccv: params[:ccv],
      holder_name: params[:cardholder_name]
    }
    
    # Serviço existente:
    updated = Subscriptions::UpdatePaymentMethodService.call(
      subscription: subscription,
      payment_data: payment_data
    )
    
    render json: updated
  rescue Payments::AsaasAPIError => e
    render json: { error: e.message }, status: :unprocessable_entity
  end
end
```

## 3. Usar Provider Diretamente (Teste)

```ruby
# No console Rails
provider = Payments::ProviderFactory.build('asaas')

user = User.find(1)
plan = Plan.where(name: 'Pro').first

# Dados de teste (sandbox)
payment_data = {
  method: 'credit_card',
  number: '4111111111111111',
  expiry_month: '12',
  expiry_year: '2026',
  ccv: '123',
  holder_name: 'John Doe'
}

customer_data = {
  name: 'John Doe',
  document: '12345678901',
  phone: '11999999999'
}

# Criar assinatura
result = provider.create_subscription(
  user: user,
  plan: plan,
  payment_data: payment_data,
  customer_data: customer_data
)

puts "✅ Assinatura criada!"
puts "ID Asaas: #{result[:external_subscription_id]}"
puts "Status: #{result[:status]}"
puts "Expira em: #{result[:expires_at]}"

# Salvar no banco
subscription = UserSubscription.create!(
  user: user,
  plan: plan,
  external_subscription_id: result[:external_subscription_id],
  payment_provider: result[:provider],
  status: UserSubscription::STATUSES[:active],
  started_at: result[:started_at],
  expires_at: result[:expires_at],
  payment_method_brand: result[:payment_method_brand],
  payment_method_last4: result[:payment_method_last4],
  payment_method_token: result[:payment_method_token],
  customer_name: result[:customer_name],
  customer_document: result[:customer_document],
  customer_phone: result[:customer_phone]
)
```

## 4. Criar Assinatura com PIX

```ruby
# Frontend coleta dados de cliente, não de cartão
payment_data = {
  method: 'pix'  # Asaas gera QR code automaticamente
}

customer_data = {
  name: 'Maria Silva',
  document: '98765432100',
  phone: '21987654321'
}

provider = Payments::ProviderFactory.build('asaas')
result = provider.create_subscription(
  user: user,
  plan: plan,
  payment_data: payment_data,
  customer_data: customer_data
)

# Resultado contém dados para PIX
# Usuário escaneia QR code no dashboard Asaas
```

## 5. Criar Assinatura com Boleto

```ruby
payment_data = {
  method: 'boleto'  # Asaas gera boleto automaticamente
}

customer_data = {
  name: 'Pedro Santos',
  document: '55544433322',
  phone: '85988776655'
}

provider = Payments::ProviderFactory.build('asaas')
result = provider.create_subscription(
  user: user,
  plan: plan,
  payment_data: payment_data,
  customer_data: customer_data
)

# Resultado contém URL do boleto para pagamento
```

## 6. Cancelar Assinatura

```ruby
# Controller
class Api::SubscriptionsController < Api::ApiController
  def cancel
    subscription = current_user.current_subscription
    
    # Serviço existente:
    Subscriptions::CancelService.call(subscription: subscription)
    
    render json: { status: 'cancelled' }
  rescue Payments::AsaasAPIError => e
    render json: { error: e.message }, status: :unprocessable_entity
  end
end
```

## 7. Renovar Assinatura Expirada

```ruby
# Jobs rodam automaticamente diariamente
# Mas pode ser chamado manualmente:

subscription = UserSubscription.find(123)

provider = Payments::ProviderFactory.build('asaas')
result = provider.renew_subscription(
  external_subscription_id: subscription.external_subscription_id,
  plan: subscription.plan,
  payment_data: {
    method: subscription.payment_method_brand,
    brand: subscription.payment_method_brand,
    last4: subscription.payment_method_last4,
    token: subscription.payment_method_token
  }
)

# Atualizar banco:
subscription.update!(
  status: UserSubscription::STATUSES[:active],
  expires_at: result[:expires_at],
  last_renewed_at: Time.current
)
```

## 8. Verificar Status de Assinatura

```ruby
# No console, verificar dados salvos
subscription = UserSubscription.find(123)

puts "Status: #{subscription.status}"
puts "Provider: #{subscription.payment_provider}"
puts "ID Asaas: #{subscription.external_subscription_id}"
puts "Forma de pagamento: #{subscription.payment_method_brand} ***#{subscription.payment_method_last4}"
puts "Expira em: #{subscription.expires_at}"
puts "Dias restantes: #{subscription.expires_in_days}"

# Verificar se ativa:
if subscription.active?
  puts "✅ Assinatura ativa!"
else
  puts "❌ Assinatura inativa"
end
```

## 9. Tratamento de Erros

```ruby
begin
  provider = Payments::ProviderFactory.build('asaas')
  result = provider.create_subscription(
    user: user,
    plan: plan,
    payment_data: { number: '123...', ... },
    customer_data: { ... }
  )
rescue Payments::BaseProvider::ProviderError => e
  # Erro geral de provider
  logger.error("Provider error: #{e.message}")
  # "Provedor de pagamento não suportado: xxx"
rescue Payments::AsaasAPIError => e
  # Erro específico da API Asaas
  logger.error("Asaas error: #{e.message}")
  # "Cartão recusado", "CPF inválido", "Cliente não encontrado"
rescue StandardError => e
  # Erro desconhecido
  logger.error("Unknown error: #{e.message}")
end
```

## 10. Testar com Diferentes Cenários

```ruby
# Console Rails para testes

# Cenário 1: Cartão aprovado
payment_data = {
  method: 'credit_card',
  number: '4111111111111111',  # Visa - OK
  expiry_month: '12',
  expiry_year: '2026',
  ccv: '123',
  holder_name: 'John Doe'
}

# Cenário 2: Cartão recusado (teste de erro)
payment_data = {
  method: 'credit_card',
  number: '5105105105105100',  # Visa - RECUSADO
  expiry_month: '12',
  expiry_year: '2026',
  ccv: '123',
  holder_name: 'Jane Doe'
}

# Cenário 3: PIX (sem dados de cartão)
payment_data = {
  method: 'pix'
}

# Executar com cada cenário:
provider = Payments::ProviderFactory.build('asaas')
result = provider.create_subscription(
  user: user,
  plan: plan,
  payment_data: payment_data,
  customer_data: customer_data
)

puts result.inspect
```

## 11. Migrando de MockProvider para AsaasProvider

```bash
# .env ANTES (desenvolvimento)
PAYMENT_PROVIDER=mock

# .env DEPOIS (com Asaas)
PAYMENT_PROVIDER=asaas
ASAAS_API_KEY=aac_sandbox_xxxxx
ASAAS_SANDBOX=true
```

**Não há mudanças no código!** A única mudança é no `.env`.

---

## 12. Helpers Úteis para Frontend

```typescript
// frontend/src/services/api/billing.ts

interface PaymentData {
  method: 'credit_card' | 'pix' | 'boleto' | 'debit_card';
  // Se credit_card:
  number?: string;
  expiryMonth?: string;
  expiryYear?: string;
  ccv?: string;
  holderName?: string;
  brand?: string;
  last4?: string;
}

interface CustomerData {
  name: string;
  document: string; // CPF/CNPJ
  phone: string;
}

// Usar em formulário:
async function createSubscription(
  planId: number,
  paymentData: PaymentData,
  customerData: CustomerData
) {
  const response = await api.post('/api/subscription', {
    plan_id: planId,
    payment_data: paymentData,
    customer_data: customerData
  });
  
  return response.data; // UserSubscription
}
```

---

## 13. Job de Renovação Automática

```ruby
# app/jobs/subscription_renewal_job.rb
# Já existe! Funciona com Asaas automaticamente

class SubscriptionRenewalJob
  include Sidekiq::Job

  def perform
    # Encontra assinaturas expiradas com auto_renew=true
    UserSubscription
      .where(status: 'active')
      .where(auto_renew: true)
      .where('expires_at <= ?', Time.current)
      .each do |subscription|
      
      begin
        Subscriptions::RenewalService.call(subscription: subscription)
        logger.info "✅ Renovada: #{subscription.id}"
      rescue => e
        logger.error "❌ Erro renovando #{subscription.id}: #{e.message}"
      end
    end
  end
end
```

---

## Comandos Úteis

```bash
# Testes
rspec spec/services/payments/asaas_provider_spec.rb
rspec spec/services/payments/asaas_provider_spec.rb -v  # Verbose

# Console Rails
rails c
provider = Payments::ProviderFactory.build('asaas')

# Logs
tail -f log/development.log | grep -i asaas

# Verificar configuração
rails c
Rails.application.config_for(:payment)
```

---

## 📞 Suporte

Se algo não funcionar:

1. Verifique `.env` tem `ASAAS_API_KEY`
2. Reinicie Rails: `rails s`
3. Verifique logs: `tail log/development.log`
4. Teste no console: `rails c` e rode exemplos acima
5. Consulte `ASAAS_INTEGRATION_GUIDE.md`
