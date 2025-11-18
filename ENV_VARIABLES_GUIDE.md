# 🔐 Guia de Variáveis de Ambiente - Chord Keeper

## 📋 Índice
- [Configuração Rápida](#configuração-rápida)
- [Variáveis Obrigatórias](#variáveis-obrigatórias)
- [Variáveis Opcionais](#variáveis-opcionais)
- [Ambientes](#ambientes)
- [Segurança](#segurança)

---

## ⚡ Configuração Rápida

### Backend (Rails)

```bash
# 1. Copiar arquivo de exemplo
cp .env.example .env

# 2. Gerar secrets
rails secret  # Use este valor para DEVISE_JWT_SECRET_KEY
rails secret  # Use este valor para SECRET_KEY_BASE (produção)

# 3. Editar .env com suas credenciais
vim .env

# 4. Reiniciar aplicação
docker-compose down
docker-compose up
```

### Frontend (React/Vite)

```bash
# 1. Copiar arquivo de exemplo
cd frontend
cp .env.example .env

# 2. Editar com a URL da API
vim .env

# 3. Reiniciar frontend
npm run dev
```

---

## 🔴 Variáveis OBRIGATÓRIAS

### Backend

| Variável | Descrição | Exemplo | Obrigatório Em |
|----------|-----------|---------|----------------|
| `DEVISE_JWT_SECRET_KEY` | Secret para JWT tokens | `rails secret` | 🔴 Todos |
| `DATABASE_PASSWORD` | Senha do PostgreSQL | `secure_password` | 🔴 Produção |
| `DOMAIN_NAME` | URL da aplicação | `https://chordkeeper.com` | 🔴 Produção |
| `FRONTEND_URL` | URL do frontend | `https://app.chordkeeper.com` | 🔴 Produção |
| `SECRET_KEY_BASE` | Secret base do Rails | `rails secret` | 🔴 Produção |

### Como Gerar Secrets

```bash
# No container Docker
docker-compose exec web rails secret

# Ou localmente (se tiver Rails instalado)
rails secret

# Resultado exemplo:
# f28f75ec47b06ab533cf379bc8717efea2fa792dfa5d51e27179f8cda32c62b6
```

---

## 🟡 Variáveis IMPORTANTES (Funcionalidades)

### Google OAuth

Para ativar login com Google, configure:

| Variável | Onde Obter | Documentação |
|----------|-----------|--------------|
| `GOOGLE_CLIENT_ID` | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) | [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md) |
| `GOOGLE_CLIENT_SECRET` | Google Cloud Console | Mesmo link acima |

**Passo a passo:**
1. Acesse Google Cloud Console
2. Crie um projeto
3. Ative Google+ API
4. Crie credenciais OAuth 2.0
5. Configure redirect URIs:
   - Dev: `http://localhost:3000/users/auth/google_oauth2/callback`
   - Prod: `https://api.chordkeeper.com/users/auth/google_oauth2/callback`

### Stripe Payments

Para ativar pagamentos, configure:

| Variável | Onde Obter | Tipo |
|----------|-----------|------|
| `STRIPE_PUBLISHABLE_KEY` | [Stripe Dashboard](https://dashboard.stripe.com/apikeys) | Pública |
| `STRIPE_SECRET_KEY` | Stripe Dashboard | 🔴 Secreta |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Webhooks | 🔴 Secreta |

**Configuração de Webhooks:**
```
URL: https://api.chordkeeper.com/webhooks/stripe
Eventos: 
  - checkout.session.completed
  - customer.subscription.created
  - customer.subscription.updated
  - customer.subscription.deleted
  - invoice.payment_succeeded
  - invoice.payment_failed
```

---

## 🟢 Variáveis OPCIONAIS

### Email (SMTP)

```bash
SMTP_ADDRESS=smtp.gmail.com
SMTP_PORT=587
SMTP_DOMAIN=chordkeeper.com
SMTP_USERNAME=noreply@chordkeeper.com
SMTP_PASSWORD=your-app-password
SMTP_AUTHENTICATION=plain
SMTP_ENABLE_STARTTLS_AUTO=true
DEFAULT_FROM_EMAIL=noreply@chordkeeper.com
```

### Storage (AWS S3)

```bash
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=us-east-1
AWS_BUCKET=chordkeeper-production
```

### Monitoring

```bash
# Sentry para monitoramento de erros
SENTRY_DSN=https://your-key@sentry.io/project-id

# Redis para cache e jobs
REDIS_URL=redis://localhost:6379/0
```

---

## 🌍 Configuração por Ambiente

### Development

```bash
# .env (development)
RAILS_ENV=development
DATABASE_PASSWORD=chordkeeper
DOMAIN_NAME=http://localhost:3000
FRONTEND_URL=http://localhost:8080
DEVISE_JWT_SECRET_KEY=dev_secret_key_here
```

```bash
# frontend/.env (development)
VITE_API_URL=http://localhost:3000
```

### Staging

```bash
# .env (staging)
RAILS_ENV=production
DATABASE_PASSWORD=secure_staging_password
DOMAIN_NAME=https://staging-api.chordkeeper.com
FRONTEND_URL=https://staging.chordkeeper.com
DEVISE_JWT_SECRET_KEY=staging_secret_key_different_from_prod
SECRET_KEY_BASE=staging_secret_base_key
```

```bash
# frontend/.env.staging
VITE_API_URL=https://staging-api.chordkeeper.com
```

### Production

```bash
# .env (production) ou variáveis no servidor
RAILS_ENV=production
DATABASE_PASSWORD=ultra_secure_production_password
DOMAIN_NAME=https://api.chordkeeper.com
FRONTEND_URL=https://app.chordkeeper.com
DEVISE_JWT_SECRET_KEY=production_secret_jwt_key
SECRET_KEY_BASE=production_secret_base_key
RAILS_LOG_LEVEL=warn
WEB_CONCURRENCY=4

# OAuth & Payments
GOOGLE_CLIENT_ID=123456-abc.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-real-secret
STRIPE_SECRET_KEY=sk_live_real_key
STRIPE_WEBHOOK_SECRET=whsec_real_secret

# CORS
ALLOWED_ORIGINS=https://app.chordkeeper.com,https://www.chordkeeper.com
```

```bash
# frontend/.env.production
VITE_API_URL=https://api.chordkeeper.com
```

---

## 🔒 Segurança - Checklist

### ✅ Desenvolvimento
- [ ] Arquivo `.env` no `.gitignore`
- [ ] Usar valores de exemplo seguros
- [ ] Não compartilhar .env em pull requests

### ✅ Staging
- [ ] Secrets diferentes de produção
- [ ] Usar banco de dados separado
- [ ] Configurar SSL/TLS

### ✅ Produção
- [ ] ⚠️ **NUNCA** usar valores de exemplo
- [ ] Gerar novos secrets únicos (`rails secret`)
- [ ] Senhas fortes (mínimo 32 caracteres)
- [ ] Usar gerenciador de secrets (AWS Secrets Manager, Vault, etc)
- [ ] Rotacionar secrets a cada 90 dias
- [ ] Habilitar `config.force_ssl = true`
- [ ] Restringir CORS às origens específicas
- [ ] Configurar HTTPS em todos os endpoints
- [ ] Backups automáticos do banco de dados
- [ ] Monitoramento e alertas configurados

---

## 🛠️ Ferramentas de Gestão de Secrets

### Heroku
```bash
# Definir variável
heroku config:set DEVISE_JWT_SECRET_KEY=your-secret-key

# Ver variáveis
heroku config

# Remover variável
heroku config:unset VARIABLE_NAME
```

### AWS Elastic Beanstalk
```bash
# Via CLI
eb setenv DEVISE_JWT_SECRET_KEY=your-secret-key

# Via Console: Environment → Configuration → Software → Environment properties
```

### Docker Compose (Produção)
```yaml
# docker-compose.production.yml
services:
  web:
    environment:
      - DEVISE_JWT_SECRET_KEY=${DEVISE_JWT_SECRET_KEY}
      - DATABASE_PASSWORD=${DATABASE_PASSWORD}
    env_file:
      - .env.production
```

### Kubernetes Secrets
```bash
# Criar secret
kubectl create secret generic chord-keeper-secrets \
  --from-literal=devise-jwt-secret-key=your-secret \
  --from-literal=database-password=your-password

# Usar no deployment
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: web
    env:
    - name: DEVISE_JWT_SECRET_KEY
      valueFrom:
        secretKeyRef:
          name: chord-keeper-secrets
          key: devise-jwt-secret-key
```

---

## 🧪 Testando Configuração

### Verificar Variáveis Carregadas

```bash
# No Rails console
docker-compose exec web rails console

# Verificar variáveis
> ENV['DEVISE_JWT_SECRET_KEY']
> ENV['DATABASE_PASSWORD']
> ENV['FRONTEND_URL']
```

### Testar Conexões

```bash
# Testar banco de dados
docker-compose exec web rails db:migrate:status

# Testar Stripe
docker-compose exec web rails console
> Stripe.api_key = ENV['STRIPE_SECRET_KEY']
> Stripe::Plan.list(limit: 1)

# Testar Google OAuth
# Acesse: http://localhost:3000/users/auth/google_oauth2
```

---

## ❓ Troubleshooting

### Erro: "DEVISE_JWT_SECRET_KEY is not set"

**Solução:**
```bash
# Verificar se .env existe
ls -la .env

# Adicionar variável
echo "DEVISE_JWT_SECRET_KEY=$(docker-compose exec web rails secret)" >> .env

# Reiniciar
docker-compose restart
```

### Erro: "Can't connect to database"

**Solução:**
```bash
# Verificar DATABASE_PASSWORD
grep DATABASE_PASSWORD .env

# Verificar se o postgres está rodando
docker-compose ps

# Recriar banco
docker-compose exec web rails db:drop db:create db:migrate
```

### Frontend não consegue conectar à API

**Solução:**
```bash
# Verificar VITE_API_URL
cat frontend/.env

# Verificar CORS no backend
grep ALLOWED_ORIGINS .env

# Reiniciar frontend
cd frontend && npm run dev
```

---

## 📚 Referências

- [Rails Credentials](https://guides.rubyonrails.org/security.html#custom-credentials)
- [The Twelve-Factor App](https://12factor.net/config)
- [OWASP Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [Docker Secrets](https://docs.docker.com/engine/swarm/secrets/)

---

## 📞 Suporte

Para questões sobre configuração:
1. Consulte `SECURITY_REPORT.md` para recomendações de segurança
2. Veja `GOOGLE_OAUTH_SETUP.md` para configuração OAuth
3. Leia `PAYMENT_INTEGRATION.md` para setup do Stripe

**Próxima revisão:** Sempre que adicionar novas funcionalidades que requerem secrets!
