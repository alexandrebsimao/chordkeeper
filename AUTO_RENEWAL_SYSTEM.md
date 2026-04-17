# 🔄 Sistema de Renovação Automática de Assinaturas

**Data**: 17 de Abril de 2026  
**Status**: ✅ IMPLEMENTADO

---

## 📋 Visão Geral

O sistema de renovação automática funciona com 3 estágios:

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ASSINATURA ATIVA                                           │
│  Válida até: XX/XX/XXXX                                    │
│                                                             │
│        ↓ (1 dia antes da expiração)                        │
│                                                             │
│  JOB EXECUTA: SubscriptionRenewalJob                       │
│  ├─ Encontra assinaturas próximas de expirar             │
│  ├─ Chama RenewalService.call()                          │
│  └─ Tenta cobrar cartão                                  │
│                                                             │
│        ↓ (Resultado do pagamento)                          │
│                                                             │
│        ↙               ↘                                    │
│                                                             │
│   ✅ SUCESSO          ❌ FALHA                             │
│   └─ Estende 30d      └─ Marca como past_due             │
│   └─ Reset tentativas └─ Inicia contagem 10 dias         │
│                                                             │
│                        ↓ (Próximas tentativas a cada dia)  │
│                                                             │
│                   Tenta novamente...                       │
│                                                             │
│                  ↙              ↘                          │
│                                                             │
│            ✅ DENTRO DOS 10 DIAS        ❌ PASSOU DOS 10 DIAS
│            ✅ Estende expiração         ❌ Downgrade para FREE
│                                          ❌ Remove acesso premium
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Componentes Implementados

### 1. **Migração Database**
`db/migrate/20260417000001_add_renewal_tracking_to_user_subscriptions.rb`

Adiciona colunas de rastreamento:
- `renewal_failed_at` - Marca quando começou a falhar
- `renewal_attempts` - Contador de tentativas
- `renewal_tolerance_ends_at` - Data limite da tolerância (10 dias)
- `downgraded_at` - Marca quando fez downgrade
- `previous_plan_id` - Referência ao plano antes do downgrade

### 2. **RenewalService**
`app/services/subscriptions/renewal_service.rb` (ATUALIZADO)

**Responsabilidades**:
- ✅ Tenta cobrar via provider
- ✅ Se sucesso: estende expires_at
- ✅ Se falha (1ª vez): marca como past_due + 10 dias
- ✅ Se falha (dentro 10 dias): continua tentando
- ✅ Se falha (após 10 dias): downgrade para free plan

**Fluxo Detalhado**:

```ruby
# 1. Tenta renovação
RenewalService.new.call(subscription)

# 2. Se SUCESSO:
subscription.update!(
  expires_at: Time.current + 30.days,
  status: :active,
  renewal_failed_at: nil,
  renewal_attempts: 0
)
# Notifica e retorna ✅

# 3. Se FALHA (1ª vez):
subscription.update!(
  renewal_failed_at: Time.current,
  renewal_tolerance_ends_at: Time.current + 10.days,
  status: :past_due,
  renewal_attempts: 1
)
# Notifica: "Erro ao renovar. Tentando nos próximos 10 dias"

# 4. Se FALHA (dentro 10 dias):
subscription.update!(
  renewal_attempts: N + 1,
  status: :past_due
)
# Notifica: "X dias restantes para renovação"

# 5. Se FALHA (após 10 dias):
# Faz downgrade para plano free
subscription.update!(
  plan_id: FREE_PLAN_ID,
  status: :active,
  downgraded_at: Time.current,
  renewal_tolerance_ends_at: nil
)
# Notifica: "Downgraded para plano free"
```

### 3. **SubscriptionRenewalJob**
`app/jobs/subscription_renewal_job.rb` (ATUALIZADO)

**Quando Executa**:
- Diariamente (configurado em scheduler)
- Procura assinaturas que expiram em até 1 dia

**O Que Faz**:
```ruby
def perform
  # Encontra assinaturas que expiram amanhã ou já expiraram
  subscriptions = UserSubscription
    .where(status: [:active, :past_due], auto_renew: true)
    .where("expires_at <= ?", Time.current + 1.day)
  
  subscriptions.each { |sub| renew_subscription(sub) }
end
```

### 4. **RenewalDebugService**
`app/services/subscriptions/renewal_debug_service.rb` (NOVO)

Service auxiliar para teste e debug:

```ruby
service = Subscriptions::RenewalDebugService.new

# Ver status completo
service.show_status(subscription)

# Forçar renovação imediata
service.force_renew(subscription)

# Simular passagem de dias
service.simulate_days_passed(subscription, 12)

# Listar assinaturas que precisam renovar
service.list_pending_renewals

# Processar todas as pendentes
service.process_all_pending
```

### 5. **UserSubscription Model** (ATUALIZADO)

Novos escopos:
```ruby
UserSubscription.expires_soon(1)              # Expira em 1 dia
UserSubscription.past_due                     # Em falha de renovação
UserSubscription.in_renewal_tolerance         # Dentro 10 dias
UserSubscription.renewal_tolerance_expired    # Passou dos 10 dias
```

Novos métodos:
```ruby
subscription.past_due?                    # Status verificação
subscription.downgraded?                  # Já foi downgraded?
subscription.renewal_tolerance_ends_in_days # Dias restantes
```

---

## 📊 Ciclo de Vida da Assinatura

### Estágio 1: ATIVO ✅

```
Status: active
expires_at: 30 dias no futuro
renewal_attempts: 0
renewal_failed_at: nil
```

**Trigger**: 1 dia antes de expirar  
**Job**: SubscriptionRenewalJob executa

---

### Estágio 2: TENTATIVA DE RENOVAÇÃO 🔄

```
Teste de pagamento:
├─ ✅ Sucesso → Volta ao Estágio 1
└─ ❌ Falha → Vai para Estágio 3
```

---

### Estágio 3: FALHA (Past Due) 🟠

```
Status: past_due
renewal_failed_at: agora
renewal_tolerance_ends_at: agora + 10 dias
renewal_attempts: 1
```

**Duração**: 10 dias  
**Job**: Continua tentando 1x por dia  
**Usuário**: Recebe notificação de erro

---

### Estágio 4a: RENOVAÇÃO DENTRO DOS 10 DIAS ✅

```
Se pagamento suceder entre dia 1-10:
├─ expires_at: estendido 30 dias
├─ status: active
├─ renewal_attempts: reset para 0
└─ renewal_failed_at: nil
```

Usuário volta ao Estágio 1

---

### Estágio 4b: FALHA APÓS 10 DIAS ❌

```
Se passar dos 10 dias sem sucesso:
├─ plan_id: FREE_PLAN_ID
├─ status: active (agora com plano free)
├─ downgraded_at: agora
├─ expires_at: nil (plano free não expira)
└─ renewal_tolerance_ends_at: nil
```

**Resultado**:
- Usuário perde acesso aos recursos premium
- Vai para plano free
- Pode fazer upgrade novamente

---

## 📅 Timeline de Exemplo

```
Dia 1:
├─ Assinatura criada
├─ expires_at = 30 dias
└─ status = active

Dia 29:
├─ Job SubscriptionRenewalJob executa
├─ Encontra assinatura que expira amanhã
├─ Chama RenewalService.call()
├─ Tenta cobrar: ❌ FALHA (cartão inválido)
├─ status = past_due
├─ renewal_failed_at = 29º dia
├─ renewal_tolerance_ends_at = 29º dia + 10 dias (39º dia)
└─ Notifica usuário

Dia 30:
├─ Job executa novamente
├─ Tenta cobrar: ❌ FALHA
├─ renewal_attempts = 2
└─ Notifica: "8 dias restantes"

Dia 35:
├─ Usuário atualiza cartão
├─ Job executa
├─ Tenta cobrar: ✅ SUCESSO!
├─ expires_at = 35 + 30 = dia 65
├─ status = active
├─ renewal_attempts = 0
└─ Notifica: "Renovação bem-sucedida"

---

OU SE FALHAR TODOS OS 10 DIAS:

Dia 39 (fim da tolerância):
├─ Job executa
├─ renewal_tolerance_ends_at < agora ✓
├─ Faz downgrade
├─ plan_id = FREE_PLAN_ID
├─ downgraded_at = dia 39
├─ status = active (plano free)
└─ Notifica: "Downgraded para FREE. Acesso premium removido"
```

---

## 🧪 Como Testar

### Teste 1: Força Renovação Imediata

```bash
rails console

subscription = User.first.current_subscription
service = Subscriptions::RenewalDebugService.new

# Ver status
service.show_status(subscription)

# Forçar renovação
service.force_renew(subscription)

# Ver novo status
service.show_status(subscription)
```

### Teste 2: Simular 12 Dias Passados

```bash
# Simula passagem de 12 dias
subscription = User.first.current_subscription
service = Subscriptions::RenewalDebugService.new

service.show_status(subscription)
# renewal_tolerance_ends_in_days: 10

service.simulate_days_passed(subscription, 12)
# renewal_tolerance_ends_in_days: -2 (passou!)

service.show_status(subscription)
# Deve estar com downgraded_at preenchido

# Rodar job para fazer o downgrade
SubscriptionRenewalJob.new.perform
```

### Teste 3: Executar Job Manualmente

```bash
# Rodar job manualmente
SubscriptionRenewalJob.perform_now

# OU com enfileramento
SubscriptionRenewalJob.set(wait: 1.hour).perform_later
```

### Teste 4: Ver Assinaturas Pendentes

```bash
service = Subscriptions::RenewalDebugService.new
service.list_pending_renewals
service.process_all_pending
```

---

## 📧 Notificações Enviadas

| Evento | Tipo | Mensagem | Ação |
|--------|------|----------|------|
| Renovação sucedida | ✅ | "Assinatura renovada até DD/MM/YYYY" | Info |
| 1ª falha | ⚠️ | "Erro ao renovar. Tentando nos próximos 10 dias" | Alerta |
| Falha (dia N) | 🔄 | "X dias restantes para renovação. Verifique seu cartão" | Lembrança |
| Downgrade | 🔴 | "Downgraded para plano free. Acesso premium removido" | Crítico |

---

## 🔧 Configuração Necessária

### 1. Scheduler (Cron Job)

No `config/schedule.rb`:

```ruby
# Execute SubscriptionRenewalJob diariamente às 2 AM
every 1.day, at: '2:00 am' do
  runner "SubscriptionRenewalJob.perform_now"
end
```

Ou com Sidekiq/Active Job:

```ruby
# config/environments/production.rb
config.active_job.queue_adapter = :sidekiq
```

### 2. Action Mailer (Notificações)

As notificações são criadas como `SubscriptionNotification`:

```ruby
subscription.subscription_notifications.create!(
  kind: 'renewal_success',
  title: '✅ Assinatura Renovada',
  message: '...'
)
```

Opcionalmente enviar email:

```ruby
# app/mailers/subscription_mailer.rb
def renewal_success(subscription)
  @subscription = subscription
  mail(to: @subscription.user.email, subject: '✅ Assinatura Renovada')
end
```

### 3. Free Plan Obrigatório

Certifique-se que existe um plano "Free":

```bash
Plan.create!(
  name: 'Free',
  price_cents: 0,
  interval: 'month',
  duration_days: nil,  # Free não expira
  features_list: ['basic_features']
)
```

---

## ⚠️ Casos Extremos Tratados

### 1. Provider Indisponível
```ruby
# Se Asaas está down
# → Falha é registrada
# → Retenta próximo dia
# → Após 10 dias: downgrade
✅ Tratado
```

### 2. Cartão Expirado
```ruby
# Pagamento falha
# → Notifica usuário para atualizar
# → Retenta próximo dia
# → Após 10 dias: downgrade
✅ Tratado
```

### 3. Usuário Cancelou Cartão
```ruby
# Forma de pagamento inválida
# → Falha imediata
# → Notifica para atualizar dados
# → Downgrade após 10 dias
✅ Tratado
```

### 4. Mudança de Plano Durante Renovação
```ruby
# Usuário muda plano enquanto está em past_due
# → Mantém status past_due
# → Tenta renovar com novo plano
# → Se sucesso: renova
# → Se falha: continua contador
✅ Tratado
```

---

## 🎯 Métricas & Monitoramento

### Ver Saúde das Renovações

```ruby
# Assinaturas próximas de expirar
UserSubscription.expires_soon(1).count

# Em estado past_due
UserSubscription.past_due.count

# Ainda dentro da tolerância
UserSubscription.in_renewal_tolerance.count

# Tolerância expirada (deve fazer downgrade)
UserSubscription.renewal_tolerance_expired.count

# Downgraded para free
UserSubscription.where.not(downgraded_at: nil).count
```

---

## 📝 Logs

Todos os eventos são logados:

```
[SubscriptionRenewalJob] Encontradas 5 assinaturas para renovar
[RenewalService] Assinatura 123 renovada com sucesso
[RenewalService] Erro ao renovar assinatura 124: Cartão recusado
[RenewalService] Primeira falha de renovação para assinatura 124
[RenewalService] Assinatura 125 downgraded para plano free após falha
```

Verifique em: `log/production.log`

---

## 🔐 Segurança

### ✅ Implementado

- Nenhum número de cartão completo armazenado
- Apenas token do provider
- Cobranças via API segura do Asaas
- Notificações via sistema interno (não email com dados)
- Downgrade automático sem intervenção manual

---

## 🚀 Deploy & Runtime

### 1. Executar Migração

```bash
rails db:migrate
```

### 2. Configurar Scheduler

```bash
# Se usar whenever gem
whenever --update-crontab

# Se usar Sidekiq
# Adicionar job a sidekiq config
```

### 3. Começar Job

```bash
# Teste imediato
rails runner "SubscriptionRenewalJob.perform_now"

# Production (via scheduler)
# Executará automaticamente
```

---

## 📞 Troubleshooting

### Assinaturas não estão renovando?

```ruby
# Check 1: Job está rodando?
Sidekiq::Client.enqueue_to_in(queue_name, delay, job_class)

# Check 2: Assinaturas têm auto_renew = true?
UserSubscription.where(auto_renew: false).count

# Check 3: Provider está configurado?
Payments::ProviderFactory.build

# Check 4: Forçar uma renovação
service = Subscriptions::RenewalDebugService.new
service.force_renew(subscription)
```

### Downgrade não aconteceu?

```ruby
# Check tolerância expirou?
subscription.renewal_tolerance_ends_at < Time.current

# Forçar downgrade manual
Subscriptions::RenewalService.new.send(:downgrade_to_free_plan, subscription, error)

# Ou rodar job
SubscriptionRenewalJob.perform_now
```

---

## 📚 Referências

- RenewalService: `app/services/subscriptions/renewal_service.rb`
- RenewalJob: `app/jobs/subscription_renewal_job.rb`
- RenewalDebugService: `app/services/subscriptions/renewal_debug_service.rb`
- Model: `app/models/user_subscription.rb`
- Migrations: `db/migrate/20260417000001_add_renewal_tracking_to_user_subscriptions.rb`

---

**Status**: ✅ Pronto para Deploy  
**Teste Recomendado**: Executar testes acima antes de Go Live  
**Próximo**: Configurar scheduler e monitorar logs

