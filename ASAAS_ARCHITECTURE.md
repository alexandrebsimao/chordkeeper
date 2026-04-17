# Arquitetura Asaas Integration

## 1. Fluxo de Integração Alto Nível

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                         │
│  Subscription.tsx, PlanComparison.tsx, PaymentForm.tsx         │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ POST /api/subscription
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│              BACKEND (Rails API)                                │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  SubscriptionsController#create                            │ │
│  │    - Validar dados                                         │ │
│  │    - Escalar permission check                              │ │
│  └────────────────────┬───────────────────────────────────────┘ │
│                       │                                          │
│  ┌────────────────────↓───────────────────────────────────────┐ │
│  │  Subscriptions::CreateService                              │ │
│  │    - Cancelar sub anterior (se existe)                    │ │
│  │    - Chamar payment provider                               │ │
│  │    - Salvar no banco de dados                              │ │
│  └────────────────────┬───────────────────────────────────────┘ │
│                       │                                          │
│  ┌────────────────────↓───────────────────────────────────────┐ │
│  │  Payments::ProviderFactory.build('asaas')                  │ │
│  │    → Payments::AsaasProvider.new                           │ │
│  └────────────────────┬───────────────────────────────────────┘ │
│                       │                                          │
│  ┌────────────────────↓───────────────────────────────────────┐ │
│  │  AsaasProvider#create_subscription                         │ │
│  │    - Validar dados de pagamento                            │ │
│  │    - Criar/buscar cliente no Asaas                         │ │
│  │    - Criar assinatura recorrente                           │ │
│  │    - Retornar ID externo + detalhes                        │ │
│  └────────────────────┬───────────────────────────────────────┘ │
└────────────────────────┼────────────────────────────────────────┘
                         │ HTTPS
                         ↓
        ┌────────────────────────────────────┐
        │  ASAAS API (https://api.asaas.com) │
        │  POST /v3/subscriptions             │
        │  POST /v3/customers                 │
        │  PATCH /v3/subscriptions/:id        │
        │  DELETE /v3/subscriptions/:id       │
        └────────────────────┬─────────────────┘
                             │
                             ↓
        ┌────────────────────────────────────┐
        │   Gateway Asaas (Processador)      │
        │   - Cartão de Crédito              │
        │   - PIX                            │
        │   - Boleto                         │
        │   - Débito                         │
        └────────────────────────────────────┘
```

## 2. Estrutura de Pastas - Payment Services

```
app/
├── services/
│   ├── payments/
│   │   ├── base_provider.rb          # Interface abstrata
│   │   ├── mock_provider.rb          # Para testes
│   │   ├── asaas_provider.rb         # ✨ NOVO - Produção
│   │   └── provider_factory.rb       # Factory pattern
│   │
│   └── subscriptions/
│       ├── create_service.rb         # Orquestra criação
│       ├── update_payment_method_service.rb
│       ├── cancel_service.rb
│       ├── renewal_service.rb
│       └── expiry_notification_service.rb
```

## 3. Componentes do Sistema

```
┌─────────────────────────────────────────────────────────────┐
│ PAYMENT PROVIDER PATTERN                                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  BaseProvider (Abstract)                                    │
│  ├─ create_subscription()                                  │
│  ├─ update_payment_method()                                │
│  ├─ cancel_subscription()                                  │
│  └─ renew_subscription()                                   │
│                                                             │
│  ├── MockProvider (Dev/Test)                              │
│  │   └─ Retorna dados fake para teste                     │
│  │                                                         │
│  └── AsaasProvider (Production) ✨                         │
│      ├─ HTTP requests via Faraday                         │
│      ├─ Gerencia clientes Asaas                           │
│      ├─ Suporta múltiplos métodos de pagamento           │
│      ├─ Integração com ciência de cobrança               │
│      └─ Tratamento de erros robusto                       │
│                                                             │
│  ProviderFactory                                           │
│  └─ Seleciona provider via ENV                            │
│     PAYMENT_PROVIDER=asaas                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 4. Fluxo Detalhado - create_subscription()

```
AsaasProvider#create_subscription(user, plan, payment_data, customer_data)
│
├─ [1] Validar entrada
│   └─ Checar API key configurada
│
├─ [2] Garantir cliente existe
│   ├─ GET /customers?cpf=12345678901
│   ├─ Se não existe:
│   │  └─ POST /customers (criar novo)
│   └─ Retorna: customer_id
│
├─ [3] Preparar dados da assinatura
│   ├─ Normalizar intervalo (month → MONTHLY)
│   ├─ Calcular próxima data de cobrança
│   ├─ Preparar dados de pagamento por tipo
│   │   ├─ Cartão: { creditCard: {...} }
│   │   ├─ PIX: {} (gerado pela Asaas)
│   │   ├─ Boleto: {} (gerado pela Asaas)
│   │   └─ Débito: { debitCard: {...} }
│   └─ Adicionar metadata (plan_id, user_id)
│
├─ [4] Criar assinatura no Asaas
│   └─ POST /subscriptions {
│       "customer": "cus_123",
│       "billingType": "CREDIT_CARD",
│       "value": 99.99,
│       "cycle": "MONTHLY",
│       ...
│      }
│
├─ [5] Mapear resposta Asaas
│   ├─ external_subscription_id: response['id']
│   ├─ payment_method_brand: extractBrand(response)
│   ├─ payment_method_last4: extractLast4(response)
│   ├─ customer_name, document, phone
│   ├─ status: mapStatus(response['status'])
│   ├─ started_at: Time.current
│   └─ expires_at: Time.current + plan.duration_days
│
└─ Retornar Hash com todos os dados
```

## 5. Suporte a Tipos de Pagamento

```
┌────────────────────────────────────────────────────────────┐
│ MÉTODO DE PAGAMENTO                 FLUXO                 │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ 💳 Cartão de Crédito                                       │
│    payment_data:                                           │
│    - number, expiryMonth, expiryYear, ccv                 │
│    - holderName                                            │
│    Asaas: Tokeniza automaticamente                         │
│    Resultado: Assinatura ativa imediatamente              │
│                                                            │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ 💰 PIX                                                     │
│    payment_data:                                           │
│    - method: 'pix' (sem extras)                           │
│    Asaas: Gera QR Code                                     │
│    Resultado: Aguarda usuário escanear                     │
│                                                            │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ 📋 Boleto Bancário                                         │
│    payment_data:                                           │
│    - method: 'boleto' (sem extras)                        │
│    Asaas: Gera boleto com nosso número                     │
│    Resultado: Aguarda usuário pagar                        │
│                                                            │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ 🏧 Débito Direto                                           │
│    payment_data:                                           │
│    - number, expiryMonth, expiryYear, ccv                 │
│    Asaas: Debitará automaticamente                         │
│    Resultado: Assinatura ativa imediatamente              │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

## 6. Integração com Sistema Existente

```
DATABASE (PostgreSQL)
│
├── plans
│   └─ Já existente ✅
│
├── user_subscriptions
│   ├─ Já existente ✅
│   ├─ Armazena: external_subscription_id (ID Asaas)
│   ├─ Armazena: payment_provider = 'asaas'
│   └─ Armazena: payment_method_brand, last4, token
│
├── users
│   └─ Já existente ✅
│
└── feature_flags / features
    └─ Pro tém que usuário tenha sub ativa ✅

SERVICES (Já existem, usam provider abstrato)
│
├── Subscriptions::CreateService
│   ├─ Chama ProviderFactory.build(provider_name)
│   ├─ Usa provider.create_subscription()
│   └─ Salva no banco ✅ FUNCIONA COM ASAAS
│
├── Subscriptions::ChangeService
│   └─ Encontra subscription ativa e atualiza ✅
│
├── Subscriptions::CancelService
│   ├─ Chama provider.cancel_subscription()
│   └─ Marca como cancelled ✅ FUNCIONA COM ASAAS
│
└── Subscriptions::RenewalService
    ├─ Chama provider.renew_subscription()
    └─ Atualiza expires_at ✅ FUNCIONA COM ASAAS
```

## 7. Comparação MockProvider vs AsaasProvider

```
┌──────────────────┬─────────────────────┬─────────────────────┐
│ Feature          │ MockProvider        │ AsaasProvider       │
├──────────────────┼─────────────────────┼─────────────────────┤
│ Ambiente         │ Desenvolvimento     │ Produção/Staging    │
│ API Calls        │ Nenhuma (local)     │ HTTPS para Asaas    │
│ Custo            │ Zerado              │ Conforme uso        │
│ Cartões          │ Todos retornam OK   │ Valida dígitos      │
│ ID Gerado        │ Mock_sub_...        │ Autêntico Asaas     │
│ Clientes         │ Nunca persiste      │ Persiste no Asaas   │
│ Ciclo Real       │ Simulado            │ Real (diário)        │
│ Webhook          │ N/A                 │ Suportado           │
│ Metadata         │ Simples             │ Completa            │
│ Erro Handling    │ Básico              │ Robusto             │
└──────────────────┴─────────────────────┴─────────────────────┘
```

## 8. Ciclo Completo - View de Usuário

```
Página: /billing/subscription
│
├─ Status Atual
│  ├─ ✅ Assinatura Ativa (Pro)
│  ├─ Expira em: 15 de maio
│  ├─ Próxima cobrança: 15 de maio
│  └─ Método: Visa **** 1111
│
├─ Ações Disponíveis
│  ├─ Mudar Plano → ChangePlanService
│  ├─ Atualizar Pagamento → UpdatePaymentService
│  │                        → provider.update_payment_method()
│  │                        → Asaas API
│  ├─ Cancelar → CancelService
│  │             → provider.cancel_subscription()
│  │             → Asaas API
│  └─ Renovar Agora → RenewalService
│                     → provider.renew_subscription()
│                     → Asaas API
│
└─ Notificações
   ├─ 7 dias antes: "Sua assinatura vence em 7 dias"
   ├─ 3 dias antes: "Sua assinatura vence em 3 dias"
   ├─ 1 dia antes: "Sua assinatura vence em 1 dia"
   └─ No vencimento: Auto-renovada ou expirada
```

## 9. Environment Configuration

```
.env
├── PAYMENT_PROVIDER=asaas
├── ASAAS_API_KEY=aac_sandbox_xxxxx (sandbox)
├── ASAAS_SANDBOX=true
└─ (Em produção:)
   ├── PAYMENT_PROVIDER=asaas
   ├── ASAAS_API_KEY=aac_prod_xxxxx (real)
   └── ASAAS_SANDBOX=false

NOTA: Sem mudanças no código, apenas .env
```

## 10. Segurança - Flow de Dados Sensíveis

```
┌──────────────────────────────────────┐
│  Frontend (Browser)                  │
│  - Usuário digita número do cartão   │
│  - NUNCA enviado em plain text       │
└────────────┬─────────────────────────┘
             │ HTTPS + Tokenização
             ↓
┌──────────────────────────────────────┐
│  Rails Backend                       │
│  - Recebe payment_data               │
│  - NUCA armazena número             │
│  - Envia direto para Asaas           │
└────────────┬─────────────────────────┘
             │ HTTPS Bearer Token
             ↓
┌──────────────────────────────────────┐
│  Asaas API                           │
│  - Processa número do cartão         │
│  - Gera token seguro                 │
│  - Retorna token (não número)        │
└────────────┬─────────────────────────┘
             │
             ↓
┌──────────────────────────────────────┐
│  Rails armazena APENAS:              │
│  - external_subscription_id          │
│  - payment_method_token              │
│  - payment_method_last4 (últimos 4)  │
│  - payment_method_brand              │
└──────────────────────────────────────┘

✅ PCI Compliant
✅ Dados sensíveis nunca no banco de dados
✅ Rails nunca processa cartão real
```

## 11. Arquivos Criados - Árvore Completa

```
chord-keeper-web/
├── app/
│   └── services/
│       └── payments/
│           ├── base_provider.rb              # Interface (não mudou)
│           ├── mock_provider.rb              # Mock (não mudou)
│           ├── asaas_provider.rb             # ✨ NOVO
│           └── provider_factory.rb           # Atualizado
│
├── spec/
│   └── services/
│       └── payments/
│           └── asaas_provider_spec.rb        # ✨ NOVO (Testes)
│
├── Gemfile                                   # Atualizado (Faraday)
├── .env.asaas.example                        # ✨ NOVO
├── ASAAS_SUMMARY.md                          # ✨ NOVO (Este arquivo)
├── ASAAS_INTEGRATION_GUIDE.md                # ✨ NOVO
├── ASAAS_IMPLEMENTATION_CHECKLIST.md         # ✨ NOVO
├── ASAAS_USAGE_EXAMPLES.md                   # ✨ NOVO
└── ASAAS_ARCHITECTURE.md                     # ✨ NOVO (Este)
```

---

**Conclusão**: A integração do Asaas segue a arquitetura de Provider abstrato existente, mantendo 100% compatibilidade com o sistema e permitindo fácil switching entre MockProvider e AsaasProvider via variável de ambiente.
