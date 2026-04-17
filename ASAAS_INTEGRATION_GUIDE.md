# Integração Asaas - Guia de Implementação

## Visão Geral

A integração com Asaas permite processar assinaturas recorrentes usando o gateway de pagamento Asaas, que suporta múltiplos métodos de pagamento populares no Brasil (cartão de crédito, PIX, boleto, débito).

## Arquitetura

A implementação segue o padrão **Provider** do sistema de assinaturas:

```
BaseProvider (interface)
├── MockProvider (desenvolvimento)
└── AsaasProvider (produção)
```

O `ProviderFactory` seleciona o provider baseado na variável de ambiente `PAYMENT_PROVIDER`.

## Configuração

### 1. Variáveis de Ambiente

Adicione ao seu arquivo `.env`:

```bash
# Provider de pagamento
PAYMENT_PROVIDER=asaas

# Credenciais Asaas
# Obtenha em: https://www.asaas.com/config/account
ASAAS_API_KEY=seu_api_key_aqui

# Ambiente (true para sandbox, false para produção)
ASAAS_SANDBOX=true
```

### 2. Obter Credenciais Asaas

1. Crie uma conta em [https://www.asaas.com](https://www.asaas.com)
2. Acesse: https://www.asaas.com/config/account
3. Vá para "API" ou "Configurações API"
4. Copie sua **Chave de API** (API Key)
5. Para sandbox (teste), sempre use `ASAAS_SANDBOX=true`

### 3. Adicionar ao .env.example

```bash
# Para referência dos desenvolvedores
PAYMENT_PROVIDER=asaas
ASAAS_API_KEY=your_api_key_here
ASAAS_SANDBOX=true
```

## Como Funciona

### Fluxo de Criação de Assinatura

1. **Usuário seleciona plano** → Frontend coleta dados de pagamento
2. **Backend cria cliente no Asaas** → Se não existir por CPF
3. **Backend cria assinatura** → Com dados do cliente e forma de pagamento
4. **Asaas retorna confirmação** → External subscription ID
5. **Sistema salva no banco** → UserSubscription com referência Asaas

### Métodos de Pagamento Suportados

```ruby
# No payment_data do formulário
payment_data = {
  method: 'credit_card',  # 'credit_card', 'pix', 'boleto', 'debit_card'
  brand: 'visa',
  number: '4111111111111111',
  expiry_month: '12',
  expiry_year: '2026',
  ccv: '123',
  holder_name: 'João Silva'
}
```

### Ciclos de Cobrança

O intervalo do plano é convertido automaticamente:

| Plano | Asaas |
|-------|-------|
| day | DAILY |
| week | WEEKLY |
| month | MONTHLY |
| year | YEARLY |

## Implementação do Provider

### Métodos Implementados

#### `create_subscription`
Cria uma nova assinatura recorrente no Asaas.

```ruby
response = provider.create_subscription(
  user: user,
  plan: plan,
  payment_data: { method: 'credit_card', number: '4111...', ... },
  customer_data: { name: 'João', document: '12345678901', phone: '11999999999' }
)
# Retorna: { external_subscription_id, provider, payment_method_*, status, expires_at, ... }
```

#### `update_payment_method`
Atualiza o método de pagamento de uma assinatura ativa.

```ruby
response = provider.update_payment_method(
  external_subscription_id: 'asaas_sub_123',
  payment_data: { method: 'credit_card', ... }
)
```

#### `cancel_subscription`
Cancela uma assinatura no Asaas.

```ruby
response = provider.cancel_subscription(
  external_subscription_id: 'asaas_sub_123'
)
```

#### `renew_subscription`
Renova uma assinatura expirada (reativa ou cria novo ciclo).

```ruby
response = provider.renew_subscription(
  external_subscription_id: 'asaas_sub_123',
  plan: plan,
  payment_data: { ... }
)
```

## Tratamento de Erros

O provider lança `Payments::AsaasAPIError` se houver problemas com a API:

```ruby
begin
  provider.create_subscription(...)
rescue Payments::AsaasAPIError => e
  # Handle: "Cartão recusado", "Cliente inválido", etc
  logger.error("Asaas error: #{e.message}")
  # Mostrar erro ao usuário
end
```

## Webhooks (Opcional)

Asaas envia eventos para webhooks. Implemente em produção:

```ruby
# app/controllers/webhooks/asaas_webhooks_controller.rb
class Webhooks::AsaasWebhooksController < ApplicationController
  skip_authentication! # Asaas faz request sem autenticação
  
  def handle
    event = params[:event]
    data = params[:data]
    
    case event
    when 'SUBSCRIPTION_EXPIRED'
      # Atualizar status da assinatura
    when 'SUBSCRIPTION_PAYMENT_RECEIVED'
      # Processar pagamento
    when 'SUBSCRIPTION_PAYMENT_FAILED'
      # Notificar sobre falha de pagamento
    end
    
    head :ok
  end
end
```

Configure o webhook em: https://www.asaas.com/config/webhooks

## Migração de Provider (MockProvider → AsaasProvider)

### Para Ambiente de Teste/Desenvolvimento

Mantenha `PAYMENT_PROVIDER=mock` para testes rápidos sem custos.

### Para Staging

Configure com credenciais de sandbox Asaas:
```bash
PAYMENT_PROVIDER=asaas
ASAAS_SANDBOX=true
ASAAS_API_KEY=sua_chave_de_sandbox
```

### Para Produção

Mude para credenciais de produção:
```bash
PAYMENT_PROVIDER=asaas
ASAAS_SANDBOX=false
ASAAS_API_KEY=sua_chave_de_producao
```

## Testando a Integração

### 1. Teste Manual na UI

1. Acesse: Billing → Subscribe
2. Selecione um plano
3. Use cartão de teste Asaas: `4111 1111 1111 1111` (expiração: 12/2026, CVV: qualquer)
4. Preencha dados do cliente
5. Envie

### 2. Teste via API

```bash
# Terminal
curl -X POST http://localhost:3000/api/subscription \
  -H "Authorization: Bearer seu_token" \
  -H "Content-Type: application/json" \
  -d '{
    "plan_id": 1,
    "payment_data": {
      "method": "credit_card",
      "number": "4111111111111111",
      "expiry_month": "12",
      "expiry_year": "2026",
      "ccv": "123",
      "holder_name": "John Doe"
    },
    "customer_data": {
      "name": "John Doe",
      "document": "12345678901",
      "phone": "11999999999"
    }
  }'
```

### 3. Verificar Logs

```bash
tail -f log/development.log | grep Asaas
```

## Troubleshooting

### "ASAAS_API_KEY não configurada"

Verifique:
```bash
echo $ASAAS_API_KEY
```

Se vazio, adicione ao `.env`:
```bash
ASAAS_API_KEY=sua_chave
```

### "Unauthorized" (erro 401)

- Chave API incorreta ou expirada
- Regenere em: https://www.asaas.com/config/account

### "Customer not found"

- CPF não existe no Asaas
- Provider criará novo cliente automaticamente

### Erro de Conexão (timeout)

- Verifique internet
- Asaas pode estar indisponível
- Implemente retry logic

## Roadmap Futuro

- [ ] Suporte a webhook automático para sincronizar status
- [ ] Tokenização de cartão via Asaas Tokenizer
- [ ] Parcelamento automático
- [ ] Relatórios de cobrança
- [ ] Integração com antifraude Asaas

## Referências

- [Documentação Asaas](https://dev.asaas.com)
- [API Subscriptions](https://dev.asaas.com/reference/criar-assinatura)
- [Códigos de Erro](https://dev.asaas.com/reference/erros)

## Suporte

Para problemas:
1. Verifique log em `log/development.log`
2. Consulte dashboard Asaas: https://www.asaas.com
3. Abra issue com detalhes do erro
