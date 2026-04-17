# Teste de Cobrança Recorrente

## 1. Environment Setup

```bash
cd chord-keeper-web

# Instalar gems se necessário
bundle install

# Setup database
rails db:reset
rails db:migrate
rails db:seed
```

## 2. Teste Manual via Console Rails

### Teste Básico: Criar Assinatura

```ruby
# No console: rails c

# 1. Obter um usuário
user = User.first

# 2. Obter um plano (Pro Monthly)
plan = Plan.find_by(name: "Pro")

# 3. Criar assinatura
subscription = Subscriptions::CreateService.new(
  user: user,
  plan: plan
).call

# Verificar criação
puts "Subscription ID: #{subscription.id}"
puts "Status: #{subscription.status}"
puts "Plan: #{subscription.plan.name}"
puts "Expires at: #{subscription.expires_at}"
puts "Auto Renew: #{subscription.auto_renew}"
```

### Teste: Trocar Plano

```ruby
# Trocar para Pro Annual
pro_annual = Plan.find_by(name: "Pro Annual")

updated_sub = Subscriptions::ChangePlanService.new(
  subscription: subscription,
  new_plan: pro_annual
).call

puts "New Plan: #{updated_sub.plan.name}"
puts "New Expiry: #{updated_sub.expires_at}"
puts "Duration Days: #{updated_sub.plan.duration_days}"
```

### Teste: Renovação Manual

```ruby
# Simular renovação
original_expiry = subscription.expires_at

renewed_sub = Subscriptions::RenewalService.new.call(subscription)

puts "Original Expiry: #{original_expiry}"
puts "New Expiry: #{renewed_sub.expires_at}"
puts "Last Renewed: #{renewed_sub.last_renewed_at}"
```

### Teste: Job de Renovação

```ruby
# Simular job executando
SubscriptionRenewalJob.perform_now

# Verificar logs
subscription.reload
puts "Status: #{subscription.status}"
puts "Last Renewed: #{subscription.last_renewed_at}"
```

### Teste: Notificações

```ruby
# Verificar notificações criadas
subscription.notifications.each do |notif|
  puts "#{notif.title}: #{notif.message}"
end
```

## 3. Teste via API

### Listar Planos

```bash
curl http://localhost:3000/api/plans
```

Resposta esperada:
```json
[
  {
    "id": 1,
    "name": "Free",
    "description": "Perfect for getting started...",
    "price_cents": 0,
    "interval": "month",
    "duration_days": 0,
    "features": ["Unlimited Songs", "1 Setlist", "Personal Use Only"],
    "max_songs": 50,
    "max_setlists": 1,
    "max_collaborators": 0,
    "active": true
  },
  ...
]
```

### Obter Assinatura Atual

```bash
curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:3000/api/subscriptions/me
```

### Assinar Plano

```bash
curl -X POST http://localhost:3000/api/subscriptions \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "plan_id": 2,
       "customer": {
         "name": "João Silva",
         "document": "12345678900",
         "phone": "11999999999"
       },
       "payment": {
         "token": "mock_token_visa",
         "brand": "visa",
         "last4": "4242"
       }
     }'
```

### Trocar Plano

```bash
curl -X PATCH http://localhost:3000/api/subscriptions/change-plan \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"plan_id": 3}'
```

### Renovar Assinatura

```bash
curl -X POST http://localhost:3000/api/subscriptions/renew \
     -H "Authorization: Bearer $TOKEN"
```

### Cancelar Assinatura

```bash
curl -X DELETE http://localhost:3000/api/subscriptions \
     -H "Authorization: Bearer $TOKEN"
```

## 4. Teste da UI

### Acesso Local

1. Iniciar servidor frontend:
```bash
cd chord-keeper-web/frontend
npm run dev
```

2. Navegar para: `http://localhost:5173/billing`

3. Testar fluxo:
   - [ ] Toggle entre Mensal/Anual
   - [ ] Ver preços recalculados
   - [ ] Ver badge de economia (20%)
   - [ ] Selecionar plano
   - [ ] Preencher dados
   - [ ] Clicar "Assinar plano"
   - [ ] Verificar feedback de sucesso

### Verificação No Frontend

```javascript
// No console do navegador (F12)

// Verificar planos carregados
const plans = await fetch('/api/plans').then(r => r.json());
console.log(plans);

// Verificar assinatura atual
const sub = await fetch('/api/subscriptions/me', {
  headers: {'Authorization': 'Bearer YOUR_TOKEN'}
}).then(r => r.json());
console.log(sub);
```

## 5. Teste de Cenários Edge Cases

### Cenário 1: Usuário Free -> Pro

```ruby
user = User.create!(email: 'free_user@test.com', password: 'password')
free_plan = Plan.find_by(name: 'Free')
pro_plan = Plan.find_by(name: 'Pro')

# Criar assinatura free
free_sub = Subscriptions::CreateService.new(user: user, plan: free_plan).call

# Trocar para Pro
pro_sub = Subscriptions::ChangePlanService.new(
  subscription: free_sub,
  new_plan: pro_plan
).call

# Verificar se renovação ocorre
renewed = Subscriptions::RenewalService.new.call(pro_sub)
puts "✓ Upgrade from Free to Pro works"
```

### Cenário 2: Auto-renewal Desativado

```ruby
subscription.update!(auto_renew: false)
subscription.update!(expires_at: Time.current - 1.day)

# Job não deve renovar
SubscriptionRenewalJob.perform_now

subscription.reload
puts "Status: #{subscription.status}"
# Deve continuar 'active' porque auto_renew is false
```

### Cenário 3: Múltiplas Renovações

```ruby
subscription = UserSubscription.find(1)

5.times do |i|
  Subscriptions::RenewalService.new.call(subscription)
  subscription.reload
  puts "Renewal #{i+1}: expires #{subscription.expires_at}"
  sleep 0.1
end
```

## 6. Verificações de Dados

### Verificar Planos Criados

```ruby
Plan.active.each do |plan|
  puts "#{plan.name} - #{plan.interval} - R$ #{plan.formatted_price} - #{plan.duration_days}d"
end

# Saída esperada:
# Free - month - R$ 0,00 - 0d
# Pro - month - R$ 9,99 - 30d
# Pro Annual - year - R$ 99,99 - 365d
# Premium - month - R$ 29,99 - 30d
# Premium Annual - year - R$ 299,99 - 365d
```

### Verificar Subscriptions de um Usuário

```ruby
user = User.first
puts "User: #{user.email}"
puts "Current Subscription:"
if user.current_subscription
  sub = user.current_subscription
  puts "  Plan: #{sub.plan.name}"
  puts "  Status: #{sub.status}"
  puts "  Expires: #{sub.expires_at}"
  puts "  Auto Renew: #{sub.auto_renew}"
else
  puts "  No active subscription"
end

puts "\nAll Subscriptions:"
user.subscriptions.each do |sub|
  puts "  #{sub.plan.name} - #{sub.status} - #{sub.created_at.strftime('%d/%m/%Y')}"
end
```

### Verificar Notificações

```ruby
SubscriptionNotification.recent.each do |notif|
  puts "#{notif.created_at.strftime('%H:%M')} - #{notif.title}"
  puts "  #{notif.message}"
end
```

## 7. Testes Automatizados (RSpec)

```ruby
# spec/services/subscriptions/renewal_service_spec.rb

describe Subscriptions::RenewalService do
  let(:user) { create(:user) }
  let(:plan) { create(:plan, duration_days: 30) }
  let(:subscription) { create(:user_subscription, user: user, plan: plan) }

  describe '#call' do
    it 'renews subscription with new expiry date' do
      original_expiry = subscription.expires_at
      
      Subscriptions::RenewalService.new.call(subscription)
      
      expect(subscription.reload.expires_at)
        .to be > original_expiry
    end

    it 'creates renewal notification' do
      expect {
        Subscriptions::RenewalService.new.call(subscription)
      }.to change {
        subscription.notifications.count
      }.by(1)
    end

    it 'sets last_renewed_at' do
      Subscriptions::RenewalService.new.call(subscription)
      
      expect(subscription.reload.last_renewed_at)
        .to be_within(1.second).of(Time.current)
    end
  end
end
```

## 8. Monitoramento em Produção

### Verificar Jobs Agendados

```ruby
# Rails console
Solid::Queue::RecurringExecution.where(
  class_name: 'SubscriptionRenewalJob'
).last(5).each do |exec|
  puts "#{exec.scheduled_at} - #{exec.finished_at || 'pending'}"
end
```

### Verificar Taxa de Renovação

```ruby
# Última semana
recent = UserSubscription.where('last_renewed_at > ?', 7.days.ago)
puts "Renovações últimos 7 dias: #{recent.count}"

# Subscrições que expiraram sem renovar
failed = UserSubscription.where(
  status: :expired,
  auto_renew: true
).where('expires_at < ?', Time.current)
puts "Renovações que falharam: #{failed.count}"
```

## 9. Troubleshooting

### Seeds não criaram planos?

```bash
rails db:seed
```

Verificar output:
```
✓ Created 5 subscription plans
```

### UI mostra planos vazios?

Console do navegador:
```javascript
// Teste a API
fetch('/api/plans')
  .then(r => r.json())
  .then(plans => console.log('Plans:', plans))
  .catch(e => console.error('Error:', e))
```

### Job não está renov ando?

```ruby
# Verificar se há subs para renovar
UserSubscription.where(
  status: :active,
  auto_renew: true,
).where('expires_at <= ?', Time.current).count

# Executar job manualmente
SubscriptionRenewalJob.perform_now

# Verificar logs
tail -f log/production.log
```
