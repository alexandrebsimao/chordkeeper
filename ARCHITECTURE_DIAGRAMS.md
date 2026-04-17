# Diagrama de Arquitetura: Controle de Acesso e Quota

## 1️⃣ Estrutura de Dados - Relacionamentos

```
┌──────────────────────────────────────────────────────────────┐
│                        DATABASE SCHEMA                       │
└──────────────────────────────────────────────────────────────┘

   Users (user_id, email, role)
     │
     ├── has_many
     │   │
     │   └──> UserSubscriptions (subscription_id, plan_id, status, expires_at)
     │           │
     │           └──> Plans (plan_id, name, price_cents, active, sort_order)
     │                   │
     │                   └──> PlanFeatures (join)
     │                       └──> Features (key, label, description)
     │
     └──> Libraries (library_id, owner_id, name)
             │
             └──> Songs (song_id, title, artist, content)
```

## 2️⃣ Feature Access Control Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│ VERIFICAÇÃO DE ACESSO A FEATURE                                     │
└─────────────────────────────────────────────────────────────────────┘

User Request
    │
    ├─ Está autenticado?
    │   └─ Não → Error 401
    │   └─ Sim ↓
    │
    ├─ Tem assinatura ativa?
    │   └─ Não → Error 403 "No subscription"
    │   └─ Sim ↓
    │
    ├─ A assinatura expirou?
    │   └─ Sim → Error 403 "Subscription expired"
    │   └─ Não ↓
    │
    ├─ O plano tem a feature?
    │   │
    │   └─ Verificar: plan.has_feature?(key)
    │       └─ Não → Error 403 "Feature not included"
    │       └─ Sim ✅ PERMITIDO
    │
    └─ Executar ação
```

## 3️⃣ Song Limit Service Flow

```
┌──────────────────────────────────────────────────────────────────┐
│ VERIFICAÇÃO DE LIMITE DE CIFRAS                                  │
└──────────────────────────────────────────────────────────────────┘

User Tenta Criar Cifra
    │
    ├─ quota = SongLimitService.new(user)
    │
    ├─ Tem assinatura?
    │   └─ Não → limit = nil (resultado: pode criar)
    │   └─ Sim ↓
    │
    ├─ Qual o plano?
    │   │
    │   ├─ "Free" → limit = 10
    │   ├─ "Premium" → limit = 100
    │   ├─ "Professional" → limit = nil (ilimitado)
    │   │
    │   └─ ↓
    │
    ├─ Quantas cifras o usuário tem?
    │   └─ count = user.owned_libraries.joins(:songs).count(:songs)
    │
    ├─ Comparar
    │   │
    │   ├─ count < limit → ✅ CAN CREATE
    │   │   └─ Retorna: { can_create: true, available: limit - count, ... }
    │   │
    │   ├─ count >= limit → ❌ CANNOT CREATE
    │   │   └─ Retorna: { can_create: false, error_message: "..." }
    │   │
    │   └─ limit = nil → ✅ CAN CREATE (unlimited)
    │
    └─ Return status
```

## 4️⃣ API Request/Response Examples

```
┌──────────────────────────────────────────────────────────────────┐
│ GET /api/quota - Ver Status de Quota                             │
└──────────────────────────────────────────────────────────────────┘

REQUEST:
  GET /api/quota
  Headers:
    Authorization: Bearer token

RESPONSE 200:
{
  "quota": {
    "plan": "Free",
    "limit": 10,
    "limit_label": "10 cifra(s)",
    "used": 7,
    "available": 3,
    "percentage": 70.0,
    "can_create": true,
    "near_limit": false,
    "at_limit": false
  },
  "warning": null,
  "message": "Você pode criar mais cifras"
}


┌──────────────────────────────────────────────────────────────────┐
│ POST /api/songs - Criar Cifra (com Validação de Quota)           │
└──────────────────────────────────────────────────────────────────┘

REQUEST:
  POST /api/songs
  Headers:
    Authorization: Bearer token
    Content-Type: application/json
  Body:
  {
    "title": "Amazing Grace",
    "artist": "John Newton",
    "library_id": 1,
    ...
  }

RESPONSE 201 (OK):
{
  "id": 1,
  "title": "Amazing Grace",
  "artist": "John Newton",
  ...
}

RESPONSE 422 (QUOTA EXCEEDED):
{
  "error": "Você atingiu o limite de 10 cifra(s) do plano Free.",
  "quota": {
    "plan": "Free",
    "limit": 10,
    "limit_label": "10 cifra(s)",
    "used": 10,
    "available": 0,
    "percentage": 100.0,
    "can_create": false,
    "near_limit": true,
    "at_limit": true
  }
}


┌──────────────────────────────────────────────────────────────────┐
│ GET /api/songs - Listar Cifras (com Info de Quota)               │
└──────────────────────────────────────────────────────────────────┘

RESPONSE 200:
{
  "songs": [
    { "id": 1, "title": "Amazing Grace", ... },
    { "id": 2, "title": "Hallelujah", ... }
  ],
  "quota": {
    "plan": "Free",
    "used": 7,
    "limit": 10,
    ...
  },
  "warning": "⚠️ Você está usando 70% do limite..."
}
```

## 5️⃣ Frontend UI States

```
STATE 1: QUOTA NORMAL (< 80%)
┌────────────────────────────────────────┐
│ ✅ Premium • 5/100 cifras              │
├────────────────────────────────────────┤
│ ████░░░░░░░░░░░░░░░░  5%              │
├────────────────────────────────────────┤
│ ✅ Você tem 95 cifra(s) disponível(eis)│
└────────────────────────────────────────┘


STATE 2: PERTO DO LIMITE (80%+)
┌────────────────────────────────────────┐
│ ⚠️  Premium • 82/100 cifras            │
├────────────────────────────────────────┤
│ ██████████████████░░  82%              │
├────────────────────────────────────────┤
│ ⚠️ Você está usando 82% da sua cota    │
│ Tem 18 cifra(s) disponível(eis)        │
└────────────────────────────────────────┘


STATE 3: LIMITE ATINGIDO (= 100%)
┌────────────────────────────────────────┐
│ 🔒 Free • 10/10 cifras                 │
├────────────────────────────────────────┤
│ ████████████████████  100%             │
├────────────────────────────────────────┤
│ 🚫 Limite atingido                     │
│ Você criou 10 cifra(s)                 │
│                                        │
│ [📈 Fazer Upgrade de Plano]            │
└────────────────────────────────────────┘
```

## 6️⃣ Backend Implementation Structure

```
request → songs_controller.rb
              │
              ├─ before_action :check_quota!
              │                   │
              │                   └─> QuotaValidation concern
              │                       └─> SongLimitService.new(user)
              │                           └─> quota.can_create?
              │
              ├─ if quota OK
              │   └─> @song.save
              │       └─ render 201
              │
              └─ if quota NOT OK
                  └─> render 422 + quota info


Controllers que usam QuotaValidation:
  • Api::SongsController#create
  • Api::SongsController#index (info only)
  • Qualquer outro que crie recursos limitados
```

## 7️⃣ User Model - Helpers

```ruby
User.first
  ├─ .song_quota
  │   └─ Quota::SongLimitService instance
  │       ├─ .limit
  │       ├─ .songs_count
  │       ├─ .can_create?
  │       ├─ .status
  │       └─ .validate!
  │
  ├─ .can_create_song?
  ├─ .song_limit
  ├─ .songs_count
  ├─ .song_quota_status
  ├─ .song_quota_percentage
  ├─ .near_song_limit?
  └─ .at_song_limit?
```

## 8️⃣ Feature vs Quota

```
FEATURE ACCESS CONTROL
  ├─ O QUÊ: Validar se feature está no plano
  ├─ ONDE: Qualquer endpoint (export, collaboration, etc)
  ├─ COMO: current_user.can_use_feature?("export_pdf")
  └─ EXEMPLO: "Seu plano não inclui exportação de PDF"

QUOTA/LIMIT CONTROL
  ├─ O QUÊ: Limitar quantidade de recursos
  ├─ ONDE: Endpoints de criação (POST)
  ├─ COMO: quota.can_create?
  └─ EXEMPLO: "Você atingiu o limite de 10 cifras"

      ┌──────────────────────────┐
      │    User Request          │
      └────────────┬─────────────┘
                   │
         ┌─────────┴─────────┐
         │                   │
    Tem feature?        Atingiu quota?
    (acesso)           (limite)
         │                   │
    can_use_         can_create_
    feature?         song?
```

## 9️⃣ Data Flow Diagram

```
DATA FLOW: Criar Cifra
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Browser                          Backend                      DB
   │                               │                          │
   │  POST /api/songs              │                          │
   ├──── (song data) ──────────────>│                          │
   │                               │                          │
   │                          songs_controller                │
   │                          #create                         │
   │                               │                          │
   │                          check_quota!                    │
   │                               │                          │
   │                      SongLimitService                    │
   │                      .new(user)                          │
   │                               │                          │
   │                      user.owned_libraries                │
   │                      .joins(:songs).count()  ────────────>│ Query
   │                               │<──────────────────────── │
   │                               │ count = 7                │
   │                               │                          │
   │                      vs limit = 10                       │
   │                               │                          │
   │                      ✅ 7 < 10 OK                        │
   │                               │                          │
   │                      @song.save               ───────────> Create
   │                               │<──────────────────────── │
   │                               │ saved                    │
   │                               │                          │
   │<────── 201 + song data ───────┤                          │
   │

DATA FLOW: Atingiu Limite
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Browser                          Backend                      DB
   │                               │                          │
   │  POST /api/songs              │                          │
   ├──── (song data) ──────────────>│                          │
   │                               │                          │
   │                          check_quota!                    │
   │                               │                          │
   │                      SongLimitService                    │
   │                               │                          │
   │                      user.owned_libraries                │
   │                      .joins(:songs).count()  ────────────>│ Query
   │                               │<──────────────────────── │
   │                               │ count = 10               │
   │                               │                          │
   │                      vs limit = 10                       │
   │                               │                          │
   │                      ❌ 10 >= 10 NOT OK                  │
   │                               │                          │
   │                      Build error response:               │
   │                      - error message                     │
   │                      - quota status                      │
   │                               │                          │
   │<──── 422 + error + quota info ┤                          │
   │
```

## 🔟 Testing Strategy

```
UNIT TESTS: SongLimitService
  ├─ Limits (free=10, premium=100, pro=nil)
  ├─ Songs Count (across libraries)
  ├─ Can Create? (OK, near limit, at limit)
  ├─ Usage Percentage (0-100%)
  ├─ Status Hash (all fields)
  └─ Error Messages

INTEGRATION TESTS: Controller
  ├─ POST /api/songs with quota OK
  ├─ POST /api/songs with quota exceeded
  ├─ GET /api/quota
  └─ Different plan levels

E2E TESTS: Frontend
  ├─ Display quota status
  ├─ Show warning at 80%
  ├─ Block creation at 100%
  └─ Show upgrade button
```

---

**Última atualização:** Abril 2026
