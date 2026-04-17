# 🎯 Guia de Implementação: Limite de Cifras por Plano

## ✅ Checklist de Implementação Completa

### Passo 1: Backend - Criar o Serviço (PRONTO)
- [x] Arquivo criado: `app/services/quota/song_limit_service.rb`
- [x] Define PLAN_LIMITS
- [x] Calcula quotas
- [x] Retorna status detalhado

```bash
Arquivo pronto para usar!
```

### Passo 2: Backend - Criar Concern para Controllers (PRONTO)
- [x] Arquivo criado: `app/controllers/concerns/quota_validation.rb`
- [x] before_action :check_quota!
- [x] rescue_from QuotaExceeded
- [x] Helper methods

```bash
Arquivo pronto para usar!
```

### Passo 3: Backend - Criar Controller de Quota (PRONTO)
- [x] Arquivo criado: `app/controllers/api/quota_controller.rb`
- [x] GET /api/quota endpoint

```bash
Arquivo pronto para usar!
```

### Passo 4: Backend - Adicionar Helpers ao User (PRONTO)
- [x] Arquivo criado: `app/models/user_quota_helpers.rb`
- [x] Métodos convenientes para User

💡 **Próximo**: Copiar conteúdo do arquivo para `app/models/user.rb`

### Passo 5: Backend - Atualizar Songs Controller
- [ ] Adicionar `include Concerns::QuotaValidation`
- [ ] Adicionar `before_action :check_quota!, only: [:create]`

**Código:**
```ruby
# app/controllers/api/songs_controller.rb

class Api::SongsController < Api::ApiController
  include Concerns::QuotaValidation  # ← ADICIONAR
  
  before_action :set_song, only: %i[ show edit update destroy transpose generate_pdf ]
  before_action :authorize_action!, only: %i[ new create edit update destroy ]
  before_action :authorize_song_owner!, only: %i[ edit update destroy transpose generate_pdf ]
  before_action :check_quota!, only: [:create]  # ← ADICIONAR
  
  # ... resto do código
end
```

### Passo 6: Backend - Atualizar Routes
- [ ] Adicionar rota para quota

**Adicionar em `config/routes.rb`:**
```ruby
namespace :api do
  resources :quota, only: [:show]
  # ... outras rotas
end
```

### Passo 7: Criar Planos com Limites
- [ ] Criar/atualizar planos no banco

**Via Rails Console:**
```ruby
# Limpar planos antigos (opcional)
Plan.destroy_all

# Criar novos planos
free_plan = Plan.create!(
  name: "Free",
  description: "Plano gratuito",
  price_cents: 0,
  duration_days: 999999,
  interval: "month",
  active: true,
  sort_order: 1
)
free_plan.add_feature("song_limit")

premium_plan = Plan.create!(
  name: "Premium",
  description: "Plano Premium - 100 cifras",
  price_cents: 9999,
  duration_days: 30,
  interval: "month",
  active: true,
  sort_order: 2
)
premium_plan.add_feature("song_limit")

professional_plan = Plan.create!(
  name: "Professional",
  description: "Plano Profissional - Ilimitado",
  price_cents: 29999,
  duration_days: 30,
  interval: "month",
  active: true,
  sort_order: 3
)
professional_plan.add_feature("song_limit")

puts "✓ Planos criados com sucesso"
```

### Passo 8: Atualizar Limites (Optional)
- [ ] Customizar limites se necessário

**Em `app/services/quota/song_limit_service.rb`, editar:**
```ruby
PLAN_LIMITS = {
  "Free" => 10,           # Seu limite
  "Premium" => 100,       # Seu limite
  "Professional" => nil   # nil = ilimitado
}.freeze
```

### Passo 9: Frontend - Adicionar Hook (PRONTO)
Arquivo exemplo pronto em [FEATURE_ACCESS_CONTROL.md](FEATURE_ACCESS_CONTROL.md#react-hook)

### Passo 10: Frontend - Adicionar Componentes (PRONTO)
Arquivo exemplo pronto em [FEATURE_ACCESS_CONTROL.md](FEATURE_ACCESS_CONTROL.md#component---mostrar-status)

### Passo 11: Frontend - Integrar com SongForm
- [ ] Atualizar componente de criar cifra
- [ ] Mostrar status de quota
- [ ] Bloquear criação se no limite

**Exemplo:**
```typescript
import { SongFormWithQuotaCheck } from '@/components/SongFormWithQuotaCheck';

// Usar em vez de SongForm
<SongFormWithQuotaCheck onSubmit={handleSubmit} />
```

### Passo 12: Testes (PRONTO)
- [x] Arquivo criado: `spec/services/quota/song_limit_service_spec.rb`
- [x] Todos os cenários cobertos

**Executar testes:**
```bash
cd chord-keeper-web
docker compose exec -T web rspec spec/services/quota/song_limit_service_spec.rb
```

### Passo 13: Testar Manualmente
- [ ] Logar com usuário Free
- [ ] Criar 9 cifras → OK
- [ ] Tentar criar 11ª cifra → Erro com quota info
- [ ] Verificar GET /api/quota
- [ ] Fazer upgrade para Premium
- [ ] Criar mais cifras → OK

---

## 📋 Scripts de Teste

### Teste no Rails Console

```ruby
# 1. Ver quota do usuário
user = User.first
quota = Quota::SongLimitService.new(user)
puts quota.status.to_json

# 2. Verificar se pode criar
puts quota.can_create?

# 3. Ver mensagem de aviso
puts quota.warning_message

# 4. Ver mensagem de erro
puts quota.error_message

# 5. Validar (joga exceção se não pode)
quota.validate!
```

### Teste via API (curl)

```bash
# 1. Ver quota
curl http://localhost:3000/api/quota \
  -H "Authorization: Bearer YOUR_TOKEN"

# 2. Tentar criar cifra (sem quota = erro)
curl -X POST http://localhost:3000/api/songs \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test", "library_id": 1, ...}'

# Resposta com quota info se erro
```

---

## 🔄 Fluxo de Uso

```
┌─────────────────┐
│  Usuário Tenta  │
│ Criar Nova Cifra│
└────────┬────────┘
         │
         ▼
┌────────────────────────────────────┐
│ Songs Controller#create            │
│  before_action :check_quota!       │
└────────────┬───────────────────────┘
             │
             ▼
┌───────────────────────────────────────┐
│ Concerns::QuotaValidation             │
│  def check_quota!                     │
│    quota = Quota::SongLimitService    │
│    if quota.can_create? → OK          │
│    else → Erro 422                    │
└───────────────────────────────────────┘
             │
    ┌────────┼────────┐
    │        │        │
    ▼        ▼        ▼
  ✅ OK   ⚠️ NEAR   ❌ NO
  Criar  Aviso    Erro


Resposta quando ❌ NO:
{
  "error": "Você atingiu o limite de 10 cifra(s)...",
  "quota": {
    "plan": "Free",
    "used": 10,
    "limit": 10,
    "available": 0,
    "percentage": 100.0,
    "can_create": false
  }
}
```

---

## 🗂️ Arquivos Criados/Modificados

| Arquivo | Status | Descrição |
|---------|--------|-----------|
| `app/services/quota/song_limit_service.rb` | ✅ PRONTO | Serviço principal |
| `app/controllers/concerns/quota_validation.rb` | ✅ PRONTO | Concern para controllers |
| `app/controllers/api/quota_controller.rb` | ✅ PRONTO | Endpoint GET /api/quota |
| `app/models/user_quota_helpers.rb` | ✅ PRONTO | Helpers para User model |
| `spec/services/quota/song_limit_service_spec.rb` | ✅ PRONTO | Testes completos |
| `app/controllers/api/songs_controller.rb` | 🔄 TODO | Adicionar concern e before_action |
| `config/routes.rb` | 🔄 TODO | Adicionar rotas |
| Frontend Components | 🔄 TODO | Ver exemplo em docs |

---

## ⚙️ Comandos para Setup

```bash
# 1. Verificar estrutura criada
cd chord-keeper-web

# 2. Executar migrations (se houver)
docker compose exec -T web rails db:migrate

# 3. Criar planos
docker compose exec -T web rails runner 'exec(File.read("script/create_plans.rb"))'

# 4. Executar testes
docker compose exec -T web rspec spec/services/quota/song_limit_service_spec.rb

# 5. Verificar console
docker compose exec -T web rails console
# > user = User.first
# > quota = Quota::SongLimitService.new(user)
# > puts quota.status.to_json
```

---

## 🎨 Integração Frontend

### Estados da UI

```
✅ Abaixo da quota
  └─ Botão criar habilitado
  └─ Sem aviso

⚠️  80%+ da quota
  └─ Botão criar habilitado
  └─ Com aviso amarelo
  └─ "Você está usando 80%"

❌ Atingiu quota
  └─ Botão criar desabilitado
  └─ Com mensagem vermelha
  └─ "Limite atingido"
  └─ Link para upgrade
```

---

## 📊 Relatórios de Quota

```ruby
# Ver estatísticas de quota por plano
Plan.all.each do |plan|
  quota_service = Quota::SongLimitService.new(user)
  puts "#{plan.name}: #{quota_service.songs_count}/#{quota_service.limit_label}"
end

# Ver usuários perto do limite
User.all.each do |user|
  quota = Quota::SongLimitService.new(user)
  if quota.near_limit?
    puts "#{user.email}: #{quota.usage_percentage}% used"
  end
end
```

---

## 🚀 Deploy

Após implementar:

1. ✅ Todos os arquivos estão prontos
2. ✅ Testes passam
3. ✅ Routes configuradas
4. ✅ Frontend integrado
5. ✅ Planos criados

Então:
```bash
# Fazer deploy
git add .
git commit -m "feat: adicionar limite de cifras por plano"
git push origin main

# Deploy
docker compose up --build
```

---

**Documentação relacionada:**
- [FEATURE_ACCESS_CONTROL.md](FEATURE_ACCESS_CONTROL.md) - Documentação completa
- [QUOTA_IMPLEMENTATION_EXAMPLES.md](QUOTA_IMPLEMENTATION_EXAMPLES.md) - Exemplos de uso
