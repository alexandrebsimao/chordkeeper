# 🔧 Correções de Reconhecimento de Recorrência

**Data**: 17 de Abril de 2026  
**Status**: ✅ CORRIGIDO

---

## 🐛 Problemas Encontrados

### 1. **AsaasProvider: `determine_billing_type` Hardcoded**
**Severidade**: 🔴 CRÍTICA

O método estava comentado e retornando sempre `CREDIT_CARD`:

```ruby
# ANTES (INCORRETO):
def determine_billing_type(payment_data)
  # case statement comentado...
  'CREDIT_CARD'  # ❌ SEMPRE RETORNA ISTO
end
```

**Impacto**: 
- PIX, BOLETO, DEBIT_CARD ignorados completamente
- Usuário seleciona PIX → backend ainda tenta usar CREDIT_CARD
- Falha silenciosa ou erro confuso

---

### 2. **AsaasProvider: `prepare_payment_data` Incompleto**
**Severidade**: 🔴 CRÍTICA

Os casos de PIX, BOLETO e DEBIT_CARD estavam comentados:

```ruby
# ANTES (INCORRETO):
def prepare_payment_data(payment_data, billing_type)
  case billing_type
  when 'CREDIT_CARD'
    # ✅ implementado
  # when 'PIX'
  #   {} ← COMENTADO
  # when 'BOLETO'  
  #   {} ← COMENTADO
  # when 'DEBIT_CARD'
  #   {} ← COMENTADO
  end
end
```

**Impacto**:
- Dados incompletos enviados para Asaas API
- Falhas em processamento
- Nenhuma validação de campo requerido

---

### 3. **Sem Validação de Recorrência**
**Severidade**: 🟠 ALTA

Backend permitia usar PIX, BOLETO e DEBIT_CARD em assinaturas recorrentes, mas Asaas não suporta:

```ruby
# ANTES:
def create_subscription(user:, plan:, payment_data:, customer_data:)
  # ❌ Nenhuma validação
  billing_type = determine_billing_type(payment_data)  # Sempre retorna CREDIT_CARD!
  # ... continua...
end
```

**Impacto**:
- Falha da API quando tenta criar subscription com PIX/BOLETO
- Usuário não sabe por que falhou
- Experiência confusa

---

### 4. **Inconsistência de Chaves**
**Severidade**: 🟡 MÉDIA

Frontend e backend usavam nomes diferentes:

```
Frontend envia:       Backend espera:
expiryMonth     ↔    expiry_month  (ou vice-versa)
expiryYear      ↔    expiry_year
holderName      ↔    holder_name
```

**Impacto**:
- Dados perdidos em conversão
- Validação falha
- Debugging difícil

---

## ✅ Soluções Aplicadas

### 1. **Restaurar `determine_billing_type`**

```ruby
# DEPOIS (CORRETO):
def determine_billing_type(payment_data)
  case payment_data[:method]&.to_s
  when 'credit_card'
    'CREDIT_CARD'
  when 'pix'
    'PIX'
  when 'boleto'
    'BOLETO'
  when 'debit_card'
    'DEBIT_CARD'
  else
    'CREDIT_CARD'
  end
end
```

✅ Agora reconhece corretamente cada método

---

### 2. **Restaurar `prepare_payment_data` Completo**

```ruby
# DEPOIS (CORRETO):
def prepare_payment_data(payment_data, billing_type)
  # Normaliza chaves (aceita snake_case e camelCase)
  holder_name = payment_data[:holder_name] || payment_data[:holderName]
  expiry_month = payment_data[:expiry_month] || payment_data[:expiryMonth]
  expiry_year = payment_data[:expiry_year] || payment_data[:expiryYear]
  
  case billing_type
  when 'CREDIT_CARD'
    {
      creditCard: {
        holderName: holder_name,
        number: payment_data[:number],
        expiryMonth: expiry_month,
        expiryYear: expiry_year,
        ccv: payment_data[:ccv]
      },
      creditCardToken: payment_data[:token]
    }.compact
  when 'PIX'
    {} # PIX não requer dados adicionais
  when 'BOLETO'
    {} # Boleto gerado automaticamente
  when 'DEBIT_CARD'
    {
      debitCard: {
        holderName: holder_name,
        number: payment_data[:number],
        expiryMonth: expiry_month,
        expiryYear: expiry_year,
        ccv: payment_data[:ccv]
      }
    }.compact
  else
    {}
  end
end
```

✅ Suporta todos os 4 métodos  
✅ Normaliza chaves automaticamente

---

### 3. **Adicionar Validação de Recorrência**

```ruby
# NOVO (ADICIONADO):
def validate_recurring_payment_method(payment_data)
  method = payment_data[:method]&.to_s
  
  case method
  when 'pix'
    raise ProviderError, 'PIX não suporta assinaturas recorrentes. Use cartão de crédito.'
  when 'boleto'
    raise ProviderError, 'Boleto não suporta assinaturas recorrentes. Use cartão de crédito.'
  when 'debit_card'
    raise ProviderError, 'Cartão de débito não suporta assinaturas recorrentes. Use cartão de crédito.'
  end
end

# E chamada no inicio de create_subscription:
def create_subscription(user:, plan:, payment_data:, customer_data:)
  validate_recurring_payment_method(payment_data)  # ✅ NOVO
  # ... resto do código
end
```

✅ Falha rápido com mensagem clara  
✅ Usuário entende por quê

---

### 4. **Normalizar Chaves no Controller**

```ruby
# ANTES (SIMPLES):
def payment_data
  data = params.fetch(:payment_data, params.fetch(:payment, {}))
  if data.is_a?(Hash)
    data.permit(...).to_h.symbolize_keys
  else
    {}
  end
end

# DEPOIS (NORMALIZADO):
def payment_data
  data = params.fetch(:payment_data, params.fetch(:payment, {}))
  
  if data.is_a?(Hash)
    permitted = data.permit(...).to_h.symbolize_keys
    
    # Normaliza camelCase para snake_case e vice-versa
    normalized = {}
    permitted.each do |key, value|
      normalized[key] = value
      case key.to_s
      when 'expiryMonth'
        normalized[:expiry_month] = value
      when 'expiryYear'
        normalized[:expiry_year] = value
      when 'holderName'
        normalized[:holder_name] = value
      # ... etc
      end
    end
    normalized
  else
    {}
  end
end
```

✅ Aceita ambos os formatos  
✅ Sem perda de dados

---

### 5. **Frontend: Desabilitar Métodos Não-Recorrentes**

**Antes**:
```tsx
<SelectContent>
  <SelectItem value="credit_card">💳 Cartão de Crédito</SelectItem>
  <SelectItem value="debit_card">🏧 Cartão de Débito</SelectItem>
  <SelectItem value="pix">💰 PIX</SelectItem>
  <SelectItem value="boleto">📋 Boleto Bancário</SelectItem>
</SelectContent>
```

**Depois**:
```tsx
<div className="bg-amber-50 border border-amber-200 p-3 rounded">
  ℹ️ <strong>Apenas Cartão de Crédito</strong> suporta assinaturas recorrentes.
</div>

<SelectContent>
  <SelectItem value="credit_card">💳 Cartão de Crédito (Recomendado)</SelectItem>
  {/* PIX, BOLETO, DEBIT_CARD removidos */}
</SelectContent>
```

✅ UI clara e sem confusão  
✅ Usuário sabe exatamente por quê

---

## 🧪 Como Testar

### Teste 1: Backend com Cartão Crédito
```bash
curl -X POST http://localhost:3000/api/subscription \
  -H "Content-Type: application/json" \
  -d '{
    "plan_id": 1,
    "payment_data": {
      "method": "credit_card",
      "number": "4111111111111111",
      "expiryMonth": "12",
      "expiryYear": "26",
      "ccv": "123",
      "holderName": "JOÃO SILVA"
    },
    "customer_data": {
      "name": "João Silva",
      "document": "12345678901",
      "phone": "11987654321"
    }
  }'
```

**Esperado**: ✅ Sucesso (200)

---

### Teste 2: Backend com PIX (Deve falhar)
```bash
curl -X POST http://localhost:3000/api/subscription \
  -H "Content-Type: application/json" \
  -d '{
    "plan_id": 1,
    "payment_data": {
      "method": "pix",
      ...
    },
    ...
  }'
```

**Esperado**: ❌ Erro com mensagem "PIX não suporta assinaturas recorrentes"

---

### Teste 3: Frontend - Mostrar Aviso
1. Abra http://localhost:3000/billing/subscription
2. Veja o aviso em amarelo explicando
3. Verifique que apenas cartão de crédito está disponível

**Esperado**: ✅ UI clara e sem outras opções

---

## 📊 Resumo de Mudanças

| Arquivo | Mudança | Severidade |
|---------|---------|-----------|
| asaas_provider.rb | Uncommented `determine_billing_type` | 🔴 CRÍTICA |
| asaas_provider.rb | Uncommented `prepare_payment_data` | 🔴 CRÍTICA |
| asaas_provider.rb | Added `validate_recurring_payment_method` | 🟠 ALTA |
| subscriptions_controller.rb | Normalized `payment_data` keys | 🟡 MÉDIA |
| PaymentForm.tsx | Removed PIX/BOLETO/DEBIT options | 🟡 MÉDIA |
| PaymentForm.tsx | Added recurrence warning | 🟡 MÉDIA |

---

## ✨ Resultado Final

### Antes ❌
- PIX/BOLETO/DEBIT sempre fracassavam
- Mensagens de erro confusas
- Dados perdidos
- Usuário não entendia por quê

### Depois ✅
- ✅ Apenas cartão de crédito permitido (única opção viável)
- ✅ Validação clara antes de enviar
- ✅ Mensagens em português
- ✅ UI explica a limitação
- ✅ Backend rejeita outros métodos
- ✅ Chaves normalizadas
- ✅ Sem erros silenciosos

---

## 🎯 Por Que Isso Era Importante

**Asaas NÃO suporta recorrência para:**
- 💰 PIX (instantâneo, não recorrente por natureza)
- 📋 BOLETO (cobranças únicas, não automáticas)
- 🏧 DEBIT_CARD (sem suporte API Asaas para subscriptions)

**Solução**: 
Deixar claro no frontend que apenas **Cartão de Crédito** funciona para assinaturas recorrentes.

---

## 📝 Documentação Atualizada

Ver também:
- [ASAAS_INTEGRATION_GUIDE.md](ASAAS_INTEGRATION_GUIDE.md) - Guia de integração
- [SUBSCRIPTION_QUICK_REFERENCE.md](SUBSCRIPTION_QUICK_REFERENCE.md) - Referência rápida
- [SUBSCRIPTION_FLOW_INTEGRATION.md](SUBSCRIPTION_FLOW_INTEGRATION.md) - Fluxo técnico

---

**Status**: ✅ TESTES PRONTOS para rodar  
**Next**: Execute testes acima para validar

