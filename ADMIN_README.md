# Sistema de Administração ChordKeeper

## 📋 Visão Geral

Sistema completo de administração com controle de planos, usuários e feature flags.

## 🗄️ Estrutura do Banco de Dados

### Tabelas Criadas

1. **plans** - Planos de assinatura
   - name, price_cents, interval (month/year)
   - max_songs, max_setlists, max_collaborators
   - features (JSON), active, sort_order

2. **user_subscriptions** - Assinaturas dos usuários
   - user_id, plan_id, status
   - started_at, expires_at, cancelled_at
   - payment_provider, external_subscription_id

3. **feature_flags** - Controle de funcionalidades
   - key, name, description
   - enabled, allowed_plans (JSON)
   - config (JSON)

4. **users** - Adicionado campo `role`
   - role: 'user' ou 'admin'

## 🚀 Como Usar

### 1. Executar as Migrations

```bash
docker-compose exec web rails db:migrate
```

### 2. Popular o Banco (Seeds)

```bash
docker-compose exec web rails db:seed
```

Isso criará:
- 4 planos padrão (Free, Starter, Pro, Team)
- 8 feature flags
- 1 usuário admin (admin@chordkeeper.com / admin123)

### 3. Acessar o Painel Admin

Login como admin:
- Email: admin@chordkeeper.com
- Senha: admin123

URLs do painel:
- Dashboard: `/admin/dashboard`
- Gerenciar Planos: `/admin/plans`
- Gerenciar Usuários: `/admin/users`
- Feature Flags: `/admin/features`

## 📊 Planos Padrão

### Free (R$ 0/mês)
- 20 músicas
- 3 setlists
- 1 colaborador

### Starter (R$ 4.99/mês)
- 100 músicas
- Setlists ilimitadas
- 1 colaborador
- Features: compartilhamento público, scroll automático, transposição

### Pro (R$ 9.99/mês)
- Músicas ilimitadas
- Setlists ilimitadas
- 5 colaboradores
- Features: todas do Starter + PDF export, colaboração, templates

### Team (R$ 29.99/mês)
- Músicas ilimitadas
- Setlists ilimitadas
- 10 colaboradores
- Features: todas do Pro + API access, analytics

## 🔐 Controle de Acesso

### Backend

Os controllers de admin herdam de `Admin::BaseController` que garante:
- Usuário autenticado
- Role de admin

```ruby
before_action :authenticate_user!
before_action :ensure_admin!
```

### Frontend

O sidebar mostra os links de admin apenas se `user.role === 'admin'`

## 🛠️ API Endpoints

### Admin Dashboard
```
GET /api/admin/dashboard
```

### Planos
```
GET    /api/admin/plans
POST   /api/admin/plans
GET    /api/admin/plans/:id
PATCH  /api/admin/plans/:id
DELETE /api/admin/plans/:id
```

### Usuários
```
GET   /api/admin/users
GET   /api/admin/users/search?q=email
GET   /api/admin/users/:id
PATCH /api/admin/users/:id
PATCH /api/admin/users/:id/update_role
POST  /api/admin/users/:id/assign_plan
```

### Feature Flags
```
GET    /api/admin/feature_flags
POST   /api/admin/feature_flags
GET    /api/admin/feature_flags/:id
PATCH  /api/admin/feature_flags/:id
PATCH  /api/admin/feature_flags/:id/toggle
DELETE /api/admin/feature_flags/:id
```

## 🔧 Verificação de Limites

### No Controller

Adicione o concern `PlanLimitable` aos controllers:

```ruby
class SongsController < ApplicationController
  include PlanLimitable
  
  # Automaticamente verifica limites no create
end
```

### Manualmente

```ruby
# Verificar se pode criar música
current_user.can_create_song?

# Verificar se pode criar setlist
current_user.can_create_setlist?

# Verificar acesso a feature
current_user.has_feature?('pdf_export')
```

### No Model User

```ruby
# Informações do plano
user.plan_name           # => "Pro"
user.songs_count         # => 45
user.setlists_count      # => 12
user.songs_limit         # => Float::INFINITY (ilimitado)
user.setlists_limit      # => Float::INFINITY
```

## 📝 Exemplo de Uso

### Atribuir Plano a um Usuário

```ruby
# Via console
user = User.find_by(email: 'usuario@example.com')
plan = Plan.find_by(name: 'Pro')

subscription = user.user_subscriptions.create!(
  plan: plan,
  status: 'active',
  started_at: Time.current,
  expires_at: 1.month.from_now,
  payment_provider: 'manual'
)
```

### Via API (Admin)

```bash
POST /api/admin/users/:user_id/assign_plan
{
  "plan_id": 2
}
```

### Verificar Feature para Usuário

```ruby
user.has_feature?('pdf_export')
# Verifica:
# 1. Se a feature está enabled
# 2. Se o plano do usuário está em allowed_plans
```

## 🎨 Componentes Frontend

### Páginas Criadas
- `AdminDashboard.tsx` - Dashboard com estatísticas
- `PlansManagement.tsx` - CRUD de planos
- `UsersManagement.tsx` - Gerenciar usuários e assinaturas
- `FeatureFlagsManagement.tsx` - Controle de features

### Rotas
```tsx
<Route path="/admin/dashboard" element={<AdminDashboard />} />
<Route path="/admin/plans" element={<PlansManagement />} />
<Route path="/admin/users" element={<UsersManagement />} />
<Route path="/admin/features" element={<FeatureFlagsManagement />} />
```

## 🔄 Próximos Passos

1. **Integração com Payment Gateway**
   - Stripe ou PagSeguro
   - Webhooks para atualizar status de assinatura

2. **Página de Planos Pública**
   - Mostrar planos disponíveis
   - Botão de upgrade

3. **Notificações**
   - Email quando assinatura expira
   - Avisos de limite atingido

4. **Analytics**
   - Relatórios de uso por plano
   - Métricas de conversão

5. **Soft Limits**
   - Avisar antes de atingir limite
   - Grace period após expiração

## 🐛 Troubleshooting

### Erro ao criar plano
```
Não é possível excluir plano com assinaturas ativas
```
Solução: Cancele todas as assinaturas primeiro ou desative o plano

### Feature não aparece
Verifique:
1. Feature está `enabled: true`
2. Plano do usuário está em `allowed_plans`
3. Usuário tem assinatura ativa

### Usuário não consegue criar música
Verifique:
1. `current_user.songs_count < current_user.songs_limit`
2. Se plano tem `max_songs` definido
3. Se assinatura está ativa

## 📚 Documentação Adicional

- Models: `app/models/`
- Controllers: `app/controllers/admin/`
- Concerns: `app/controllers/concerns/plan_limitable.rb`
- Frontend: `frontend/src/pages/admin/`
