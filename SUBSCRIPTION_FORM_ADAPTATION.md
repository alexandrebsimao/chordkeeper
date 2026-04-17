# 📱 Tela de Assinatura - Adaptação para Asaas

**Data**: 17 de Abril de 2026  
**Status**: ✅ Implementação Completa  
**Escopo**: Frontend React com suporte a múltiplos métodos de pagamento

---

## 🎯 O Que Foi Adaptado

### Novo Componente Criado: `PaymentForm.tsx`

**Localização**: `frontend/src/components/billing/PaymentForm.tsx`

Componente reutilizável que:
- ✅ Coleta dados pessoais (nome, CPF/CNPJ, telefone) com formatação automática
- ✅ Permite seleção de método de pagamento (cartão, PIX, boleto, débito)
- ✅ Renderiza formulários dinâmicos conforme método selecionado
- ✅ Valida campos em tempo real
- ✅ Detecta automaticamente bandeira do cartão
- ✅ Formata campos de entrada (números, telefone, datas)
- ✅ Trata erros de forma amigável
- ✅ Interface responsiva (móvel + desktop)

### Página Atualizada: `Subscription.tsx`

**Localização**: `frontend/src/pages/billing/Subscription.tsx`

Mudanças:
- ✅ Removeu formulário manual básico
- ✅ Integra novo componente `PaymentForm`
- ✅ Separa fluxo: sem assinatura (novo) vs. com assinatura (existente)
- ✅ Atualiza handlers para nova estrutura de dados
- ✅ Mantém compatibilidade com planos existentes
- ✅ Melhor UX com estados de carregamento

### Serviço de API Atualizado: `billing.ts`

**Localização**: `frontend/src/services/api/billing.ts`

Mudanças:
- ✅ Novos tipos: `PaymentData`, `CustomerData`, `PaymentMethod`
- ✅ Atualizado `subscribe()` para receber estrutura nova
- ✅ Atualizado `updatePayment()` para receber estrutura nova
- ✅ Tipos TypeScript definidos claramente
- ✅ Compatível com backend Asaas

---

## 📊 Estrutura de Dados

### Antes (Antigo)
```typescript
subscribe({
  plan_id: number,
  customer: { name, document?, phone? },
  payment: { token, brand?, last4? }
})
```

### Depois (Novo - Asaas)
```typescript
subscribe({
  plan_id: number,
  customer_data: {
    name: string,     // João Silva
    document: string, // 12345678901 (CPF/CNPJ, sem máscara)
    phone: string     // 11987654321 (apenas dígitos)
  },
  payment_data: {
    method: 'credit_card' | 'pix' | 'boleto' | 'debit_card',
    // Se cartão:
    number?: string,      // 4111111111111111
    holderName?: string,  // JOÃO SILVA
    expiryMonth?: string, // 12
    expiryYear?: string,  // 26
    ccv?: string,         // 123
    brand?: string,       // visa
    last4?: string        // 1111
  }
})
```

---

## 🎨 Campos do Formulário

### Seção 1: Dados Pessoais (Obrigatória)
| Campo | Tipo | Mascaramento | Validação |
|-------|------|--------------|-----------|
| Nome | text | - | Não vazio |
| CPF/CNPJ | text | Automático (XXX.XXX.XXX-XX) | 11-14 dígitos |
| Telefone | text | Automático ((XX) XXXXX-XXXX) | 10-11 dígitos |

### Seção 2: Método de Pagamento
- 💳 **Cartão de Crédito** - Mostra formulário de cartão
- 🏧 **Cartão de Débito** - Mesmos campos que crédito
- 💰 **PIX** - Sem campos adicionais (gera QR code na Asaas)
- 📋 **Boleto** - Sem campos adicionais (gera boleto na Asaas)

### Seção 3: Campos de Cartão (dinâmicos)
| Campo | Tipo | Mascaramento | Validação |
|-------|------|--------------|-----------|
| Número | text | XXXX XXXX XXXX XXXX | 13-19 dígitos |
| Titular | text | MAIÚSCULAS | Não vazio |
| Validade | text | MM/YY | Mês: 01-12, Ano: futuro |
| CVV | password | XXXX | 3-4 dígitos |

---

## 🔄 Fluxos de Uso

### Fluxo 1: Novo Usuário → Assinatura

```
1. Usuário acessa /billing/subscription
2. Ve comparação de planos
3. Seleciona um plano (destaca)
4. Preenche formulário PaymentForm:
   - Dados pessoais
   - Seleciona método de pagamento
   - Preenche campos conforme método
5. Clica "Assinar Plano"
6. Frontend valida
7. Envia para API:
   POST /api/subscription {
     plan_id: 1,
     customer_data: {...},
     payment_data: {...}
   }
8. Backend processa com AsaasProvider
9. Sucesso: Mostra plano ativo + botões de gerenciar
```

### Fluxo 2: Usuário Existente → Atualizar Pagamento

```
1. Usuário vê plano atual ativo
2. Clica "Atualizar Forma de Pagamento"
3. Formulário PaymentForm aparece
4. Preenche novo método de pagamento
5. Clica "Atualizar Pagamento"
6. Envia para API:
   PATCH /api/subscription/update_payment_method {
     payment_data: {...},
     customer_data: {...}
   }
7. Backend atualiza no Asaas
8. Sucesso: Mostra "Pagamento atualizado"
```

### Fluxo 3: Usuário Existente → Mudar Plano (mesmo pagamento)

```
1. Usuário seleciona novo plano
2. Clica "Trocar Plano"
3. Backend faz:
   PATCH /api/subscription/change_plan { plan_id }
4. Mantém método de pagamento anterior
5. Sucesso: Mostra novo plano
```

---

## 🎯 Recursos do Componente PaymentForm

### ✅ Validações Implementadas

```typescript
✓ Nome não vazio
✓ Documento: 11-14 dígitos (CPF/CNPJ)
✓ Telefone: 10-11 dígitos
✓ Número cartão: 13-19 dígitos válidos
✓ Titular: não vazio
✓ Validade: mês 01-12, ano futuro
✓ CVV: 3-4 dígitos
```

### ✅ Formatações Automáticas

```typescript
✓ Cartão: 4111 1111 1111 1111 (espaços a cada 4)
✓ CPF: 123.456.789-01
✓ CNPJ: 12.345.678/0001-90
✓ Telefone: (11) 98765-4321
✓ Titular: JOÃO SILVA (MAIÚSCULAS)
```

### ✅ Detecção Automática

```typescript
✓ Bandeira do cartão (Visa, Mastercard, Amex, etc)
✓ Tipo de documento (CPF ou CNPJ)
✓ Expiração em tempo real (MM/YY)
```

### ✅ UX Melhorada

```typescript
✓ Mensagens de erro em tempo real
✓ Botão desabilita durante envio
✓ Estado de loading "Processando..."
✓ Toast de sucesso/erro
✓ Foco no campo com erro
✓ Responsivo (mobile-first)
```

---

## 📱 Responsive Design

### Mobile (< 768px)
- Um campo por linha
- Inputs cheios (100% width)
- Teclado numérico para números
- Valores pré-preenchidos onde possível

### Desktop (≥ 768px)
- 2-3 colunas dependendo da seção
- Melhor aproveitamento de espaço
- Agrupamento lógico

---

## 🔐 Segurança

### ✅ Implementado
- CVV escondido (type="password")
- Nunca persiste número de cartão completo (apenas últimos 4)
- Vale com dados do servidor, não cliente-side
- Mensagens de erro genéricas para falhas de segurança
- HTTPS + CORS em produção

### ⚠️ Próximas Etapas
- [ ] Tokenização via Asaas.js (opcional, melhor segurança)
- [ ] Certificado SSL em produção
- [ ] Rate limiting em endpoints de pagamento

---

## 🧪 Testando em Desenvolvimento

### 1. Inicializar Ambiente
```bash
cd chord-keeper-web/frontend
npm start
```

### 2. Acessar Página
```
http://localhost:3000/billing/subscription
```

### 3. Testar Novo Usuário (sem assinatura)
- Selecione um plano
- Preencha dados pessoais
- Escolha "Cartão de Crédito"
- Use número: **4111 1111 1111 1111**
- Validade: **12/26**
- CVV: **123** (qualquer 3 dígitos)
- Clique "Assinar Plano"

### 4. Testar Métodos de Pagamento
Repita com:
- 💳 Cartão Mastercard: **5555 5555 5555 4444**
- 💰 PIX (sem cartão)
- 📋 Boleto (sem cartão)
- 🏧 Débito (like crédito)

### 5. Testar Atualizar
- Após subscrever, clique "Atualizar Forma de Pagamento"
- Submeta novo cartão/método

---

## 📦 Tipos Exportados

```typescript
// PaymentForm.tsx
export type PaymentMethod = "credit_card" | "pix" | "boleto" | "debit_card"
export type PaymentData = { method, number?, holderName?, ... }
export type CustomerData = { name, document, phone }

// billing.ts
export type Plan = { ... }
export type Subscription = { ... }
export type PaymentData = { ... }
export type CustomerData = { ... }
export type PaymentMethod = { ... }
```

---

## 📋 Checklist de Ativação

- [x] Componente PaymentForm criado
- [x] Subscription.tsx adaptado
- [x] billing.ts atualizado com novos tipos
- [x] Formatações implementadas
- [x] Validações implementadas
- [x] Responsivo (mobile + desktop)
- [x] Documentação completa
- [ ] Testar em navegadores (Chrome, Firefox, Safari)
- [ ] Testar em mobile real
- [ ] Testar com dados de sandbox Asaas
- [ ] Deploy em staging
- [ ] Deploy em produção

---

## 🚀 Próximas Melhorias

### Curto Prazo
- [ ] Salvar método de pagamento para próximas compras
- [ ] Suporte a múltiplas formas de pagamento por usuário
- [ ] Autocomplete de dados do perfil

### Médio Prazo
- [ ] Integração com Asaas.js para tokenização
- [ ] Autofill de dados bancários (PIX)
- [ ] Histórico de transações

### Longo Prazo
- [ ] Apple Pay / Google Pay
- [ ] 3D Secure para cartões
- [ ] Antifraude integrado

---

## 🐛 Troubleshooting

### "Campo obrigatório" mas não está vazio
- Verifique formatação esperada
- CPF: 11-14 dígitos (sem caracteres especiais na validação)
- Telefone: 10-11 dígitos

### Cartão recusado mas número está correto
- Verifique se está em sandbox (ASAAS_SANDBOX=true)
- Use cartões de teste: 4111... ou 5555...
- Validade deve ser futura

### Erro "Document não é válido"
- CPF deve ter 11 dígitos
- CNPJ deve ter 14 dígitos
- Envie sem formatação (números apenas)

---

## 📚 Referências

- Componente: `frontend/src/components/billing/PaymentForm.tsx` (350+ linhas)
- Página: `frontend/src/pages/billing/Subscription.tsx` (atualizado)
- Serviço: `frontend/src/services/api/billing.ts` (atualizado)
- Backend: `backend/asaas_provider.rb` (processa pagamentos)

---

## ✨ Status

**Implementação**: ✅ **100% Completa**  
**Testes**: 🟡 **Precisa de testes manuais**  
**Documentação**: ✅ **Completa**  
**Produção**: 🟡 **Pronto, aguardando testes**

---

**Pronto para usar!** 🎉
