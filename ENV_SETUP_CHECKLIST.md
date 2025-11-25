# ✅ Checklist de Configuração - Chord Keeper

Use este checklist para garantir que todas as variáveis de ambiente estão configuradas corretamente.

---

## 🚀 Setup Inicial

### Backend (Rails)

- [ ] Arquivo `.env` criado
  ```bash
  cp .env.example .env
  ```

- [ ] **DEVISE_JWT_SECRET_KEY** configurado
  ```bash
  # Gerar novo secret
  docker-compose exec web rails secret
  # Copiar resultado para .env
  ```

- [ ] **DATABASE_PASSWORD** definido
  ```bash
  # Dev: pode usar 'chordkeeper'
  # Prod: DEVE ser senha forte e única
  ```

- [ ] **DOMAIN_NAME** configurado
  ```bash
  # Dev: http://localhost:3000
  # Prod: https://api.chordkeeper.com
  ```

- [ ] **FRONTEND_URL** configurado
  ```bash
  # Dev: http://localhost:8080
  # Prod: https://app.chordkeeper.com
  ```

### Frontend (React/Vite)

- [ ] Arquivo `frontend/.env` criado
  ```bash
  cd frontend
  cp .env.example .env
  ```

- [ ] **VITE_API_URL** configurado
  ```bash
  # Dev: http://localhost:3000
  # Prod: https://api.chordkeeper.com
  ```

---

## 🔐 Segurança

### Desenvolvimento

- [ ] `.env` está no `.gitignore`
- [ ] `.env` não commitado no Git
- [ ] Valores de exemplo seguros

### Produção

- [ ] **SECRET_KEY_BASE** gerado e único
  ```bash
  docker-compose exec web rails secret
  ```

- [ ] Todas as senhas são fortes (min. 32 chars)
- [ ] Secrets diferentes entre dev/staging/prod
- [ ] `config.force_ssl = true` habilitado
- [ ] CORS restrito às origens corretas

---

## 🎯 Funcionalidades

### Google OAuth (Opcional)

Para habilitar login com Google:

- [ ] Projeto criado no [Google Cloud Console](https://console.cloud.google.com/)
- [ ] OAuth Consent Screen configurado
- [ ] Credenciais OAuth 2.0 criadas
- [ ] **GOOGLE_CLIENT_ID** configurado no `.env`
- [ ] **GOOGLE_CLIENT_SECRET** configurado no `.env`
- [ ] Redirect URIs configurados:
  - [ ] Dev: `http://localhost:3000/users/auth/google_oauth2/callback`
  - [ ] Prod: `https://api.chordkeeper.com/users/auth/google_oauth2/callback`

📚 **Documentação:** [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md)

### Stripe Payments (Opcional)

Para habilitar pagamentos:

- [ ] Conta Stripe criada em [stripe.com](https://stripe.com)
- [ ] **STRIPE_PUBLISHABLE_KEY** obtida (Dashboard → API Keys)
- [ ] **STRIPE_SECRET_KEY** configurada no `.env`
- [ ] **STRIPE_WEBHOOK_SECRET** configurada
- [ ] Webhook endpoint configurado no Stripe:
  - [ ] URL: `https://api.chordkeeper.com/webhooks/stripe`
  - [ ] Eventos selecionados:
    - [ ] `checkout.session.completed`
    - [ ] `customer.subscription.created`
    - [ ] `customer.subscription.updated`
    - [ ] `customer.subscription.deleted`
    - [ ] `invoice.payment_succeeded`
    - [ ] `invoice.payment_failed`

📚 **Documentação:** [PAYMENT_INTEGRATION.md](./PAYMENT_INTEGRATION.md)

### Email (Opcional)

Para envio de emails:

- [ ] Servidor SMTP configurado
- [ ] **SMTP_ADDRESS** definido
- [ ] **SMTP_PORT** definido
- [ ] **SMTP_USERNAME** definido
- [ ] **SMTP_PASSWORD** definido
- [ ] **DEFAULT_FROM_EMAIL** definido
- [ ] Testar envio de email

### Storage AWS S3 (Opcional)

Para uploads em produção:

- [ ] Bucket S3 criado
- [ ] IAM User criado com permissões S3
- [ ] **AWS_ACCESS_KEY_ID** configurado
- [ ] **AWS_SECRET_ACCESS_KEY** configurado
- [ ] **AWS_REGION** definido
- [ ] **AWS_BUCKET** definido

---

## 🧪 Testes

### Verificar Configuração

- [ ] Variáveis carregadas no Rails
  ```bash
  docker-compose exec web rails console
  > ENV['DEVISE_JWT_SECRET_KEY']
  > ENV['FRONTEND_URL']
  ```

- [ ] Banco de dados acessível
  ```bash
  docker-compose exec web rails db:migrate:status
  ```

- [ ] Frontend conecta à API
  ```bash
  # Abrir http://localhost:8080
  # Verificar console do navegador
  ```

### Testar Funcionalidades

- [ ] Login com email/senha funciona
- [ ] Login com Google funciona (se configurado)
- [ ] Checkout Stripe funciona (se configurado)
- [ ] Webhooks Stripe recebidos (se configurado)
- [ ] Emails enviados (se configurado)
- [ ] Uploads funcionam (se configurado)

---

## 🌍 Ambientes

### Development ✅

```bash
RAILS_ENV=development
DATABASE_PASSWORD=chordkeeper
DOMAIN_NAME=http://localhost:3000
FRONTEND_URL=http://localhost:8080
```

- [ ] Aplicação inicia sem erros
- [ ] Pode criar conta e fazer login
- [ ] Pode criar músicas e setlists
- [ ] Frontend conecta ao backend

### Staging 🟡

```bash
RAILS_ENV=production
DATABASE_PASSWORD=staging_secure_password
DOMAIN_NAME=https://staging-api.chordkeeper.com
FRONTEND_URL=https://staging.chordkeeper.com
SECRET_KEY_BASE=staging_secret_different_from_prod
```

- [ ] SSL/HTTPS configurado
- [ ] Domínio aponta para servidor
- [ ] DNS configurado
- [ ] Banco de dados separado
- [ ] Secrets únicos (diferentes de prod)

### Production 🔴

```bash
RAILS_ENV=production
DATABASE_PASSWORD=production_ultra_secure_password
DOMAIN_NAME=https://api.chordkeeper.com
FRONTEND_URL=https://app.chordkeeper.com
SECRET_KEY_BASE=production_secret_unique
DEVISE_JWT_SECRET_KEY=production_jwt_unique
```

- [ ] SSL/HTTPS forçado (`force_ssl = true`)
- [ ] Domínio configurado
- [ ] DNS apontando corretamente
- [ ] Certificado SSL válido
- [ ] Backup automático configurado
- [ ] Monitoramento configurado
- [ ] Logs configurados
- [ ] Secrets rotacionados recentemente
- [ ] CORS restrito às origens corretas
- [ ] Rate limiting configurado
- [ ] Firewall configurado
- [ ] Disaster recovery plan documentado

---

## 📊 Validação Final

### Checklist de Segurança

Use o script de verificação:

```bash
./bin/security_check
```

- [ ] Brakeman sem warnings
- [ ] Todas as variáveis críticas definidas
- [ ] `.env` no `.gitignore`
- [ ] Force SSL habilitado (prod)
- [ ] Secrets não hardcoded
- [ ] CORS configurado corretamente
- [ ] Strong parameters em todos os controllers
- [ ] Autorização implementada

### Performance

- [ ] Banco de dados com índices apropriados
- [ ] Assets compilados (produção)
- [ ] Cache configurado
- [ ] CDN configurado (se aplicável)
- [ ] Background jobs configurados

### Documentação

- [ ] README atualizado
- [ ] Variáveis de ambiente documentadas
- [ ] Processo de deploy documentado
- [ ] Runbook para incidentes criado

---

## 🎯 Quick Start

Execute o script de setup automático:

```bash
./bin/setup_env
```

Este script vai:
- ✅ Criar arquivo `.env` do exemplo
- ✅ Gerar secrets seguros automaticamente
- ✅ Configurar variáveis básicas
- ✅ Criar `frontend/.env`

---

## 📞 Suporte

### Documentação Relacionada

- 📘 [ENV_VARIABLES_GUIDE.md](./ENV_VARIABLES_GUIDE.md) - Guia completo de variáveis
- 🔐 [SECURITY_REPORT.md](./SECURITY_REPORT.md) - Relatório de segurança
- 🔑 [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md) - Setup Google OAuth
- 💳 [PAYMENT_INTEGRATION.md](./PAYMENT_INTEGRATION.md) - Integração Stripe
- 🔄 [RECURRING_BILLING.md](./RECURRING_BILLING.md) - Billing recorrente

### Problemas Comuns

**Erro: "DEVISE_JWT_SECRET_KEY is not set"**
- Verificar se `.env` existe
- Adicionar variável no `.env`
- Reiniciar aplicação

**Erro: "Can't connect to database"**
- Verificar `DATABASE_PASSWORD`
- Verificar se PostgreSQL está rodando
- Verificar `DATABASE_HOST`

**Frontend não conecta à API**
- Verificar `VITE_API_URL` no frontend
- Verificar CORS no backend
- Verificar se API está acessível

---

## ✨ Status

Marque quando completar cada seção:

- [ ] ✅ Setup Inicial
- [ ] 🔐 Segurança
- [ ] 🎯 Funcionalidades
- [ ] 🧪 Testes
- [ ] 🌍 Ambientes
- [ ] 📊 Validação Final

---

**Última atualização:** 18 de novembro de 2025
