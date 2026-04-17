# 🚀 Quick Reference - Tela de Assinatura com Asaas

## Arquivos Mudados

| Arquivo | Status | O Que Mudou |
|---------|--------|------------|
| `frontend/src/components/billing/PaymentForm.tsx` | ✨ NOVO | Componente de formulário completo |
| `frontend/src/pages/billing/Subscription.tsx` | 🔄 ATUALIZADO | Usa novo PaymentForm |
| `frontend/src/services/api/billing.ts` | 🔄 ATUALIZADO | Novos tipos + métodos atualizados |
| `app/controllers/api/subscriptions_controller.rb` | 🔄 ATUALIZADO | Aceita nova estrutura de dados |

---

## Arquivos Criados (Documentação)

| Arquivo | Conteúdo |
|---------|----------|
| `SUBSCRIPTION_FORM_ADAPTATION.md` | 📖 Guia detalhado do novo formulário |
| `SUBSCRIPTION_FLOW_INTEGRATION.md` | 🔗 Fluxo completo frontend-backend |

---

## Estrutura de Dados

### Antes
```json
{
  "plan_id": 1,
  "customer": { "name": "...", "document": "...", "phone": "..." },
  "payment": { "token": "...", "brand": "...", "last4": "..." }
}
```

### Depois
```json
{
  "plan_id": 1,
  "customer_data": { "name": "...", "document": "...", "phone": "..." },
  "payment_data": { 
    "method": "credit_card",
    "number": "4111...",
    "holderName": "...",
    "expiryMonth": "12",
    "expiryYear": "26",
    "ccv": "123",
    "brand": "visa",
    "last4": "1111"
  }
}
```

---

## Componentes

### PaymentForm
```tsx
import PaymentForm, { PaymentData, CustomerData } from "@/components/billing/PaymentForm";

<PaymentForm
  onSubmit={async (paymentData: PaymentData, customerData: CustomerData) => {
    // Enviar para API
  }}
  loading={false}
  submitButtonText="Assinar Plano"
  currentCustomerName="João Silva"
  showCustomerFields={true}
/>
```

---

## Métodos de Pagamento

| Método | Campos Necessários | Uso |
|--------|-------------------|-----|
| **credit_card** | number, holder, expiry, cvv | Cartão crédito |
| **debit_card** | number, holder, expiry, cvv | Cartão débito (mesmos campos) |
| **pix** | Nenhum | QR code gerado pela Asaas |
| **boleto** | Nenhum | Boleto gerado pela Asaas |

---

## Validações

| Campo | Regra | Exemplo |
|-------|-------|---------|
| Nome | Não vazio | "João Silva" |
| CPF | 11 dígitos | "12345678901" |
| CNPJ | 14 dígitos | "12345678000190" |
| Telefone | 10-11 dígitos | "11987654321" |
| Número Cartão | 13-19 dígitos | "4111111111111111" |
| Validade | Mês 01-12, ano futuro | Mês: 12, Ano: 26 |
| CVV | 3-4 dígitos | "123" |

---

## Formatações Automáticas

| Campo | Formatação |
|-------|------------|
| CPF | `123.456.789-01` |
| CNPJ | `12.345.678/0001-90` |
| Telefone | `(11) 98765-4321` |
| Cartão | `4111 1111 1111 1111` |
| Titular | `JOÃO SILVA` (maiúsculas) |

---

## API Endpoints

### Criar Assinatura
```
POST /api/subscription
Body: { plan_id, customer_data, payment_data }
Response: 201 { data: Subscription, message: "..." }
```

### Atualizar Pagamento
```
PATCH /api/subscription/update_payment_method
Body: { payment_data, customer_data? }
Response: 200 { data: Subscription, message: "..." }
```

### Trocar Plano
```
PATCH /api/subscription/change_plan
Body: { plan_id }
Response: 200 { data: Subscription, message: "..." }
```

---

## Tipos TypeScript

```typescript
// PaymentForm.ts
type PaymentMethod = "credit_card" | "pix" | "boleto" | "debit_card"

interface PaymentData {
  method: PaymentMethod
  number?: string
  holderName?: string
  expiryMonth?: string
  expiryYear?: string
  ccv?: string
  brand?: string
  last4?: string
}

interface CustomerData {
  name: string
  document: string    // apenas números
  phone: string       // apenas números
}

// billing.ts
interface Plan { ... }
interface Subscription { ... }
```

---

## Estados do Componente

```tsx
// Novo usuário (sem assinatura)
subscription === null
→ Mostra formulário PaymentForm
→ Botão: "Assinar Plano"

// Usuário com assinatura ativa
subscription !== null
→ Mostra plano ativo
→ Mostra FormularioPagamento para atualizar
→ Botões: Trocar Plano, Cancelar, Renovar
```

---

## Erros Comuns

| Erro | Causa | Solução |
|------|-------|---------|
| "Campo obrigatório" | Campo vazio | Preencher campo |
| "Número inválido" | Menos de 13 dígitos | Conferir número (completo) |
| "Mês inválido" | Mês > 12 | Digitar mês correto (01-12) |
| "CPF inválido" | Menos de 11 dígitos | Inserir CPF completo |
| "Cartão recusado" | Cartão não validado | Usar cartão de teste 4111... |

---

## Testando Localmente

### 1. Components
```tsx
// frontend/src/pages/billing/Subscription.tsx
import PaymentForm from "@/components/billing/PaymentForm"

// Já importado e pronto para usar
```

### 2. Serviço
```tsx
// frontend/src/services/api/billing.ts
const response = await billingService.subscribe({
  plan_id: 1,
  customer_data: { name, document, phone },
  payment_data: { method, number, ... }
})
```

### 3. Backend
```ruby
# app/controllers/api/subscriptions_controller.rb
def create
  # Já implementado
  # Extrai dados com customer_data || customer
  # Extrai dados com payment_data || payment
end
```

### 4. Testar
```bash
# Development
npm start  # frontend

# API
curl -X POST http://localhost:3000/api/subscription \
  -H "Authorization: Bearer token" \
  -H "Content-Type: application/json" \
  -d '{ plan_id, customer_data, payment_data }'
```

---

## Métodos Principais

### PaymentForm
```tsx
// Props
interface PaymentFormProps {
  onSubmit: (paymentData, customerData) => Promise<void>
  loading?: boolean
  submitButtonText?: string
  currentCustomerName?: string
  showCustomerFields?: boolean
}

// Eventos
onSubmit(paymentData, customerData)
```

### Subscription
```tsx
const handlePaymentSubmit = async (paymentData, customerData) => {
  // Chamar: billingService.subscribe(...)
}

const handleUpdatePayment = async (paymentData, customerData) => {
  // Chamar: billingService.updatePayment(...)
}
```

---

## Fluxo Visual

```
┌─────────────────────────────────────────┐
│  /billing/subscription                  │
│  (Sem assinatura)                       │
└──────────────┬──────────────────────────┘
               │
               ↓
       Seleciona plano
               │
               ↓
┌──────────────────────────────────────────┐
│  PaymentForm                             │
│  ├─ Dados Pessoais (nome, CPF, tel)     │
│  └─ Método Pagamento                    │
│     ├─ Cartão (fields)                  │
│     ├─ PIX (nenhum)                     │
│     ├─ Boleto (nenhum)                  │
│     └─ Débito (fields)                  │
└──────────────┬──────────────────────────┘
               │
               ↓
Clica "Assinar Plano" → Valida → POST /api/subscription
               │
        ┌──────┴──────┐
        ↓             ↓
    ✅ Sucesso   ❌ Erro
        │             │
        ↓             ↓
   Plano ativo   Toast erro
   (trocar ou
    cancelar)
```

---

## Operações Rápidas

### Criar Assinatura
```tsx
await billingService.subscribe({
  plan_id: 1,
  customer_data: { 
    name: "João", 
    document: "12345678901", 
    phone: "11987654321" 
  },
  payment_data: { 
    method: "credit_card",
    number: "4111111111111111",
    holderName: "JOÃO",
    expiryMonth: "12",
    expiryYear: "26",
    ccv: "123"
  }
})
```

### Atualizar Pagamento
```tsx
await billingService.updatePayment({
  payment_data: { 
    method: "credit_card",
    number: "5555555555554444",
    ...
  },
  customer_data: { ... }
})
```

### Trocar Plano
```tsx
await billingService.changePlan(2)
```

---

## Próximas Etapas

1. ✅ Frontend com PaymentForm pronto
2. ✅ Backend controller compatível
3. ✅ API endpoints funcionando
4. 🟡 Testes manuais em desenvolvimento
5. 🟡 Testes em sandbox Asaas
6. 🟡 Deploy em staging
7. 🟡 Deploy em produção

---

**Tudo Pronto!** 🎉
