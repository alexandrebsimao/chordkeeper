# ✅ Checklist de Ativação - Tela de Assinatura Asaas

## 📋 Antes de Começar

- [ ] Leia `SUBSCRIPTION_QUICK_REFERENCE.md` (2 min)
- [ ] Tem Node.js 18+ instalado? `node --version`
- [ ] Tem frontend rodando? `npm start`
- [ ] Backend Rails rodando? `rails s`
- [ ] Tem Asaas configurado? (veja `ASAAS_QUICKSTART.md`)

---

## 🚀 Fase 1: Verificação (15 min)

### Frontend
- [ ] Arquivos novos existem:
  - `frontend/src/components/billing/PaymentForm.tsx` (existe?)
  - `frontend/src/pages/billing/Subscription.tsx` (modificado?)
  - `frontend/src/services/api/billing.ts` (modificado?)

### Backend
- [ ] Controller modificado:
  - `app/controllers/api/subscriptions_controller.rb` (com fallback?)
  - Método `customer_data` aceita novo formato?
  - Método `payment_data` aceita novo formato?

### Documentação
- [ ] Arquivos de documentação existem:
  - `SUBSCRIPTION_FORM_ADAPTATION.md`
  - `SUBSCRIPTION_FLOW_INTEGRATION.md`
  - `SUBSCRIPTION_QUICK_REFERENCE.md`
  - `SUBSCRIPTION_IMPLEMENTATION_SUMMARY.md`

---

## 🧪 Fase 2: Teste Local (30 min)

### Setup
```bash
# 1. Ir para a pasta frontend
cd chord-keeper-web/frontend

# 2. Verificar dependências
npm list | grep -i form  # Deve ter UI components

# 3. Iniciar frontend
npm start

# 4. Em outro terminal, Rails
cd ../
rails s
```

- [ ] Frontend rodou sem erros?
- [ ] Backend respondendo?
- [ ] Sem erros no console?

### Navegar até a página
```
http://localhost:3000/billing/subscription
```

- [ ] Página carrega?
- [ ] Ve um formulário?
- [ ] Tem seletor de método de pagamento?

### Inspecionar Formulário
Abra DevTools (F12):
- [ ] Console: Algum erro?
- [ ] Network: Requests não dão erro?
- [ ] Elements: Form tem os campos?

---

## 🧮 Fase 3: Teste de Entrada de Dados (20 min)

### Testar Validações
```
Nome: deixar vazio → deve mostrar erro
CPF: digitar "123" → deve mostrar erro
Telefone: digitar nada → deve mostrar erro
Número Cartão: digitar "1111" → deve mostrar erro
```

- [ ] Validações funcionam?
- [ ] Mensagens aparecem?

### Testar Formatações
```
CPF: "12345678901" → deve ficar "123.456.789-01"
Telefone: "11987654321" → deve ficar "(11) 98765-4321"
Cartão: "4111111111111111" → deve ficar "4111 1111 1111 1111"
Titular: "joao silva" → deve ficar "JOAO SILVA"
```

- [ ] Formatações funcionam?
- [ ] Campos são agradáveis de usar?

### Testar Detecção de Bandeira
```
Número: 4111111111111111 → Deve detectar "Visa"
Número: 5555555555554444 → Deve detectar "Mastercard"
Número: 378282246310005 → Deve detectar "Amex"
```

- [ ] Bandeiras detectadas?
- [ ] Mostram embaixo do campo?

---

## 🎯 Fase 4: Teste de Métodos de Pagamento (20 min)

### Método: Cartão de Crédito
- [ ] Selecionar "Cartão de Crédito"
- [ ] Aparecem campos: número, titular, validade, CVV?
- [ ] Preencher com dados válidos
- [ ] Clica "Assinar" (conforme estilo)
- [ ] Alguma coisa acontece? (loading, erro, sucesso)

### Método: PIX
- [ ] Selecionar "PIX"
- [ ] Desaparecem campos de cartão?
- [ ] Mostram mensagem sobre QR code?
- [ ] Pode continuar?

### Método: Boleto
- [ ] Selecionar "Boleto"
- [ ] Desaparecem campos de cartão?
- [ ] Mostram mensagem sobre boleto?
- [ ] Pode continuar?

### Método: Débito
- [ ] Selecionar "Débito"
- [ ] Aparecem campos de cartão?
- [ ] Similar ao crédito?

- [ ] Todos os 4 métodos existem?
- [ ] Mudar entre eles funciona?

---

## 📡 Fase 5: Teste API (30 min)

### Via Terminal (curl)
```bash
# Obter token de autenticação
TOKEN="seu_jwt_token_aqui"

# Teste POST /api/subscription
curl -X POST http://localhost:3000/api/subscription \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "plan_id": 1,
    "customer_data": {
      "name": "Test User",
      "document": "12345678901",
      "phone": "11987654321"
    },
    "payment_data": {
      "method": "credit_card",
      "number": "4111111111111111",
      "holderName": "TEST USER",
      "expiryMonth": "12",
      "expiryYear": "26",
      "ccv": "123",
      "brand": "visa",
      "last4": "1111"
    }
  }'
```

- [ ] Resposta 201?
- [ ] Retorna subscription?
- [ ] Status "active"?

### Via Frontend
```tsx
// Dev Console > Network > XHR
// Fazer subscription via UI

// Verificar em Network:
// POST /api/subscription → 201?
// Response contém subscription?
```

- [ ] Request enviado?
- [ ] Response recebido?
- [ ] UI atualiza baseado na resposta?

---

## 💳 Fase 6: Teste com Mock (Asaas) (20 min)

### Setup Asaas Mock
Verifique `.env`:
```
PAYMENT_PROVIDER=asaas
ASAAS_API_KEY=aac_sandbox_test_key
ASAAS_SANDBOX=true
```

- [ ] Variáveis configuradas?
- [ ] Rails reiniciou?

### Testar Créação de Subscription
- [ ] Use cartão de teste: 4111 1111 1111 1111
- [ ] Preencha dados completos
- [ ] Clique "Assinar"
- [ ] Aguarde processamento

Resultados esperados:
- ✅ Sucesso: Toast verde, plano ativo exibido
- ❌ Erro: Toast vermelho com mensagem

- [ ] Se sucesso: Vir "Assinatura criada com sucesso"?
- [ ] Se erro: Vir mensagem específica?
- [ ] Dados foram para o banco? (cheque console do Rails)

---

## 📊 Fase 7: Teste Fluxo Completo (30 min)

### Cenário 1: Novo Usuário → Assinatura
```
1. [ ] Acessar /billing/subscription
2. [ ] Selecionar plano
3. [ ] Preencher PaymentForm
4. [ ] Clicar "Assinar"
5. [ ] Vir página com plano ativo
6. [ ] Ver botões: Atualizar, Trocar, Cancelar
```

### Cenário 2: Usuário Ativo → Atualizar Pagamento
```
1. [ ] Clicar "Atualizar Forma de Pagamento"
2. [ ] PaymentForm aparece novamente
3. [ ] Preencher novo método
4. [ ] Clicar "Atualizar Pagamento"
5. [ ] Toast: "Pagamento atualizado"
6. [ ] Plano continua ativo
```

### Cenário 3: Usuário Ativo → Trocar Plano
```
1. [ ] Selecionar novo plano (diferente)
2. [ ] Clicar "Trocar Plano"
3. [ ] Toast: "Plano alterado"
4. [ ] Novo plano exibido
5. [ ] Mantém método de pagamento anterior
```

---

## 🐛 Fase 8: Debugging (conforme necessário)

### Se formulário não carrega
```bash
# 1. Verificar se component existe
ls -la frontend/src/components/billing/PaymentForm.tsx

# 2. Verificar imports no Subscription.tsx
grep "PaymentForm" frontend/src/pages/billing/Subscription.tsx

# 3. Dev console: Algum erro sintático?
# F12 > Console > vira vermelho?
```

### Se API não responde
```bash
# 1. Verificar se backend rodando
curl http://localhost:3000/api/plans

# 2. Verificar logs do Rails
tail -f log/development.log | grep subscription

# 3. Checar estrutura de dados enviada
# F12 > Network > XHR > Expandir request > Payload
```

### Se dados não salvam no banco
```bash
# No console Rails
rails console
UserSubscription.last
UserSubscription.last.customer_name  # Deve ter nome
```

---

## ✨ Fase 9: Otimizações (opcional)

- [ ] Performance: Teste com DevTools Audit (Lighthouse)
- [ ] Acessibilidade: Testar navegação por teclado
- [ ] Mobile: Testar em dispositivo real
- [ ] Navegadores: Testar em (Chrome, Firefox, Safari, Edge)

---

## 🚀 Fase 10: Pronto para Deploy

Antes de fazer merge/deploy:

### Código
- [ ] Sem console.log() no código
- [ ] Sem erros de linting (`npm run lint`)
- [ ] Sem TypeScript errors (`npm run type-check`)
- [ ] Sem warnings no console

### Documentação
- [ ] Leia os 4 documentos criados
- [ ] Compartilhe com o time
- [ ] Team feedback incorporado?

### Backend
- [ ] Sem migration pendente
- [ ] Sem seed data necessária
- [ ] Testes passando? (`rspec` ou similar)

### Asaas
- [ ] Credenciais Asaas configuradas
- [ ] Esperienza testada com sandbox
- [ ] Pronto para sandbox → production?

---

## 📝 Checklist Pré-Deploy

```
Frontend:
  ☐ Build sem erros: npm run build
  ☐ Testes passam: npm test
  ☐ Lint passa: npm run lint

Backend:
  ☐ Tests passam: rspec
  ☐ Brakeman sem issues críticos
  ☐ Seeds rodadas se necessário

Código:
  ☐ Sem TODO/FIXME importantes
  ☐ Documentação inline clara
  ☐ Commits bem descritos

Asaas:
  ☐ Integração testada
  ☐ Credenciais seguras (não no repo)
  ☐ Pronto para produção

Deploy:
  ☐ Branch criado
  ☐ PR aberta
  ☐ Code review passado
  ☐ Merge para main
  ☐ Deploy staging
  ☐ Testes finais em staging
  ☐ Deploy produção
```

---

## ⏱️ Cronograma Sugerido

| Fase | Tempo | Status |
|------|-------|--------|
| 1. Verificação | 15 min | ☐ |
| 2. Teste Local | 30 min | ☐ |
| 3. Entrada de Dados | 20 min | ☐ |
| 4. Métodos de Pagamento | 20 min | ☐ |
| 5. Teste API | 30 min | ☐ |
| 6. Mock Asaas | 20 min | ☐ |
| 7. Fluxo Completo | 30 min | ☐ |
| 8. Debugging | 30 min | ☐ |
| 9. Otimizações | 30 min | ☐ |
| 10. Pré-Deploy | 30 min | ☐ |
| **TOTAL** | **~4 horas** | |

---

## 🎯 Próximos Steps após Checklist

1. ✅ Ao terminar checklist: Tudo pronto!
2. 🟡 Fazer merge para staging
3. 🟡 Deploy para staging
4. 🟡 Últimos testes antes de produção
5. 🟡 Deploy para produção
6. 🟡 Monitorar logs primeiras 24h

---

**Boa Sorte!** 🚀
