# ⚡ Asaas Quick Start (5 Minutos)

## 1️⃣ Obter Credenciais (1 min)

```bash
# Ir em: https://www.asaas.com/config/account
# → Seção "API" ou "Configurações API"
# → Copie "Chave de API"
# → Ela começa com: aac_sandbox_... ou aac_prod_...
```

## 2️⃣ Configurar .env (1 min)

```bash
# Abra: chord-keeper-web/.env

# Adicione ao final:
PAYMENT_PROVIDER=asaas
ASAAS_API_KEY=aac_sandbox_xxxxxxxxxxxxxxxxxxxxxxx
ASAAS_SANDBOX=true
```

## 3️⃣ Instalar Dependências (1 min)

```bash
# Na pasta chord-keeper-web:
bundle install
```

## 4️⃣ Reiniciar Rails (1 min)

```bash
# Parar: Ctrl+C (se está rodando)
# Iniciar:
rails s
```

## 5️⃣ Testar (1 min)

```ruby
# Terminal: rails console
provider = Payments::ProviderFactory.build('asaas')
provider.class
# => Payments::AsaasProvider

# Se não mostrar erro, está funcionando! ✅
```

---

## Pronto para Usar!

Agora ao criar assinatura via:
- PHP: `/billing/subscription` 
- API: `POST /api/subscription`

Será processada automaticamente via **Asaas** em vez de MockProvider.

---

## Testar com Cartão (Sandbox)

Na tela de subscription:
1. Selecione um plano
2. Preencha dados
3. Use cartão: **4111 1111 1111 1111**
4. Expiração: 12/2026
5. Qualquer CVV

Deve mostrar: ✅ Assinatura criada com sucesso!

---

## Troubleshooting Rápido

| Problema | Solução |
|----------|---------|
| "ASAAS_API_KEY não configurada" | Adicione ao .env e reinicie |
| "Unauthorized" | Cheque chave em https://www.asaas.com/config/account |
| "Cartão recusado" | Cartão de teste inválido, use 4111 1111 1111 1111 |
| Conexão falha | Internet desligada? Asaas fora? Tente novamente |

---

## Próximo: Testes Automatizados

```bash
rspec spec/services/payments/asaas_provider_spec.rb
```

---

## Depois (Opcional)

- [ ] Ler: `ASAAS_INTEGRATION_GUIDE.md` (completo)
- [ ] Ler: `ASAAS_USAGE_EXAMPLES.md` (exemplos)
- [ ] Ler: `ASAAS_ARCHITECTURE.md` (desenhos)
- [ ] Implementar Webhooks (receber eventos)

---

**🎉 Pronto! Asaas está integrado!**
