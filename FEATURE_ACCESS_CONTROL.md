# 🎯 Controle de Acesso de Funcionalidades por Planos

## Visão Geral

O sistema de controle de acesso permite que cada plano de assinatura tenha um conjunto específico de funcionalidades. Usuários só podem acessar as features incluídas no seu plano ativo.

**Arquitetura:**
```
User → UserSubscription → Plan → Features (via PlanFeature)
```

---

## 📊 Estrutura de Dados

### Modelos Principais

#### 1. **Plan** (`app/models/plan.rb`)
Representa um plano de assinatura com as features incluídas.

```ruby
class Plan < ApplicationRecord
  has_many :plan_features, dependent: :destroy
  has_many :features, through: :plan_features
  has_many :user_subscriptions, dependent: :restrict_with_error
  
  # Métodos principais
  def has_feature?(feature_key)          # Verifica se plano tem feature
  def add_feature(feature_key)           # Adiciona feature ao plano
  def remove_feature(feature_key)        # Remove feature do plano
  def features_list                      # Lista features formatadas
end
```

**Atributos:**
- `name` - Nome do plano (ex: "Premium", "Professional")
- `description` - Descrição
- `price_cents` - Preço em centavos
- `duration_days` - Duração em dias
- `interval` - "day", "week", "month", "year"
- `active` - Se está disponível para compra
- `sort_order` - Ordem de exibição

#### 2. **Feature** (`app/models/feature.rb`)
Representa uma funcionalidade individual.

```ruby
class Feature < ApplicationRecord
  has_many :plan_features, dependent: :destroy
  has_many :plans, through: :plan_features
  
  validates :key, presence: true, uniqueness: true
end
```

**Atributos:**
- `key` - Identificador único (ex: "export_pdf", "collaboration")
- `label` - Nome legível (ex: "Exportar como PDF")
- `description` - Descrição detalhada
- `sort_order` - Ordem de exibição

#### 3. **PlanFeature** (Join Table)
Conecta Plans e Features com relacionamento flexível.

```ruby
class PlanFeature < ApplicationRecord
  belongs_to :plan
  belongs_to :feature
end
```

#### 4. **UserSubscription** (`app/models/user_subscription.rb`)
Armazena a assinatura atual do usuário.

```ruby
class UserSubscription < ApplicationRecord
  belongs_to :user
  belongs_to :plan
  
  # Status: "active", "expired", "cancelled"
  # expires_at: data de expiração
end
```

---

## 🔐 Serviço de Controle de Acesso

### Features::Enforcer
Localizado em `app/services/features/enforcer.rb`, é o serviço central de validação.

```ruby
module Features
  class Enforcer
    def initialize(user)
      @user = user
      @plan = user.current_subscription&.plan
    end
    
    # Retorna boolean
    def check(feature_key)
      return false if @plan.nil?
      @plan.has_feature?(feature_key)
    end
    
    # Joga exceção se não tem acesso (recomendado)
    def check!(feature_key)
      unless check(feature_key)
        raise FeatureNotAllowed, "Seu plano não inclui: #{feature_label}"
      end
      true
    end
    
    # Lista todas as features habilitadas
    def enabled_features
      return [] if @plan.nil?
      @plan.features.pluck(:key)
    end
    
    # Todos os resources de features
    def all_features
      Feature.ordered
    end
  end
end
```

---

## 💻 Como Usar

### 1. **Em Controllers (Backend)**

#### Validação Simples (Boolean)
```ruby
class Api::SongsController < ApiController
  def show
    @song = Song.find(params[:id])
    
    if current_user.can_use_feature?("collaboration")
      # Incluir dados extras compartilhados
      render json: @song, include: 'collaborators'
    else
      render json: @song
    end
  end
end
```

#### Validação Rigorosa (Com Exceção)
```ruby
class Api::SongsController < ApiController
  def export_pdf
    @song = Song.find(params[:id])
    authorize_song!(@song)
    
    # Esta linha joga FeatureNotAllowed se não tem acesso
    require_feature("export_pdf")
    
    # Se chegou aqui, tem acesso garantido
    exporter = PdfExporter.new(@song)
    send_file exporter.generate, filename: "#{@song.title}.pdf"
  rescue Features::Enforcer::FeatureNotAllowed => e
    render json: { error: e.message }, status: :forbidden
  end
end
```

#### Usando Concern
```ruby
class Api::StorageController < ApiController
  include Concerns::RequiresFeature
  
  def upload_file
    require_feature("increased_storage")  # Validação automática
    # ... código de upload
  end
end
```

### 2. **Listar Features Habilitadas**

```ruby
# Apenas as chaves
features = current_user.feature_enforcer.enabled_features
# => ["export_pdf", "collaboration", "storage_increase"]

# Com detalhes
plan = current_user.current_subscription.plan
details = plan.features_list
# => [
#   { key: "export_pdf", label: "Exportar PDF", description: "...", enabled: true },
#   { key: "collaboration", ... }
# ]
```

### 3. **Em Serializers (API Response)**

```ruby
class SongSerializer < ApplicationSerializer
  attributes :id, :title, :chord_content, :features_available

  def features_available
    {
      can_export: object.user.can_use_feature?("export_pdf"),
      can_share: object.user.can_use_feature?("collaboration"),
      can_duplicate: object.user.can_use_feature?("song_templates"),
      storage_limit: object.user.can_use_feature?("storage_increase") ? 5000 : 500
    }
  end
end
```

### 4. **Em Views (HTML/ERB)**

```erb
<!-- Mostrar/Ocultar funcionalidade -->
<% if current_user.can_use_feature?("export_pdf") %>
  <div class="export-section">
    <%= button_to "📥 Exportar PDF", export_song_path(@song), method: :post %>
  </div>
<% else %>
  <div class="locked-feature">
    <p class="text-muted">
      🔒 Exportar em PDF está disponível apenas no plano <strong>Premium</strong>
    </p>
    <%= link_to "Fazer upgrade", plans_path, class: "btn btn-primary" %>
  </div>
<% end %>

<!-- Mostrar todas as features habilitadas -->
<div class="features-list">
  <% current_user.feature_enforcer.enabled_features.each do |feature_key| %>
    <span class="badge badge-success">
      <%= current_user.feature_enforcer.feature_label(feature_key) %>
    </span>
  <% end %>
</div>
```

### 5. **No Frontend (React/TypeScript)**

#### Tipo TypeScript
```typescript
// services/api/billing.ts
interface Plan {
  id: number;
  name: string;
  features: string[];  // Array de chaves de features
  price: number;
  interval: "month" | "year";
}

interface Subscription {
  plan: Plan;
  status: "active" | "expired" | "cancelled";
  expiresAt: string;
}
```

#### Usando em Components
```typescript
// components/SongCard.tsx
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  song: Song;
}

export default function SongCard({ song }: Props) {
  const { subscription } = useAuth();
  
  const canExport = subscription?.plan?.features?.includes("export_pdf");
  const canCollaborate = subscription?.plan?.features?.includes("collaboration");

  return (
    <div className="song-card">
      <h3>{song.title}</h3>
      
      <div className="actions">
        {canExport ? (
          <button onClick={() => exportPdf(song.id)} className="btn-primary">
            📥 Exportar PDF
          </button>
        ) : (
          <button disabled className="btn-locked" title="Premium only">
            🔒 Exportar PDF
          </button>
        )}
        
        {canCollaborate && (
          <button onClick={() => shareModal(song.id)} className="btn-secondary">
            👥 Compartilhar
          </button>
        )}
      </div>
    </div>
  );
}
```

#### Feature Flag Component
```typescript
// components/FeatureGate.tsx
interface Props {
  feature: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function FeatureGate({ feature, fallback, children }: Props) {
  const { subscription } = useAuth();
  
  const hasFeature = subscription?.plan?.features?.includes(feature);
  
  if (!hasFeature) {
    return fallback ? <>{fallback}</> : null;
  }
  
  return <>{children}</>;
}

// Uso:
<FeatureGate 
  feature="export_pdf"
  fallback={<button disabled>🔒 Premium only</button>}
>
  <button onClick={exportPdf}>📥 Exportar</button>
</FeatureGate>
```

---

## 📝 Exemplos Práticos Completos

### Exemplo 1: Proteger Exportação de PDF

**Backend:**
```ruby
# app/controllers/api/songs_controller.rb
class Api::SongsController < ApiController
  def export_pdf
    @song = Song.find(params[:id])
    authorize_song!(@song)
    
    # Validar acesso
    current_user.feature_enforcer.check!("export_pdf")
    
    # Gerar e enviar
    @exporter = PdfExporter.new(@song)
    send_file @exporter.generate, 
              filename: "#{@song.title}.pdf",
              type: 'application/pdf'
  rescue Features::Enforcer::FeatureNotAllowed => e
    render json: { error: e.message }, status: :forbidden
  end
end
```

**Frontend:**
```typescript
async function handleExportPdf(songId: number) {
  try {
    const response = await fetch(`/api/songs/${songId}/export_pdf`, {
      method: 'GET',
    });
    
    if (!response.ok) {
      if (response.status === 403) {
        showUpgradeModal("Exportar PDF requer plano Premium");
      } else {
        showError((await response.json()).error);
      }
      return;
    }
    
    const blob = await response.blob();
    downloadFile(blob, 'song.pdf');
  } catch (error) {
    showError("Erro ao exportar");
  }
}
```

### Exemplo 2: Limitar Armazenamento

**Backend:**
```ruby
# app/services/storage_service.rb
class StorageService
  def initialize(user)
    @user = user
  end
  
  def can_upload?(file_size)
    storage_limit = calculate_limit
    used_storage + file_size <= storage_limit
  end
  
  private
  
  def calculate_limit
    # Base: 500 MB
    # Premium (increased_storage): 5 GB
    if @user.can_use_feature?("increased_storage")
      5 * 1024 * 1024 * 1024  # 5 GB
    else
      500 * 1024 * 1024       # 500 MB
    end
  end
  
  def used_storage
    @user.attachments.sum(:byte_size)
  end
end
```

**Controller:**
```ruby
class Api::UploadsController < ApiController
  def create
    file = params[:file]
    storage = StorageService.new(current_user)
    
    unless storage.can_upload?(file.size)
      return render json: { 
        error: "Limite de armazenamento atingido",
        limit: storage.limit_mb,
        used: storage.used_mb
      }, status: :unprocessable_entity
    end
    
    # Processar upload...
  end
end
```

### Exemplo 3: Colaboração Segura

**Backend:**
```ruby
# app/models/song.rb
class Song < ApplicationRecord
  def can_be_shared_by?(user)
    user.id == owner_id && user.can_use_feature?("collaboration")
  end
  
  def allow_collaboration_for?(user)
    can_be_shared_by?(user) || 
    (shared_with?(user) && owner.can_use_feature?("collaboration"))
  end
end

# app/controllers/api/songs_controller.rb
def share
  @song = Song.find(params[:id])
  
  unless @song.can_be_shared_by?(current_user)
    return render json: { 
      error: "Apenas o proprietário pode compartilhar" 
    }, status: :forbidden
  end
  
  @song.share_with(User.find(params[:collaborator_id]))
  render json: @song, status: :created
end
```

---

## 🛠️ Administração de Planos e Features

### Creating Features

```bash
# Via Rails Console
Feature.create!(
  key: "export_pdf",
  label: "Exportar como PDF",
  description: "Permite exportar acordes em formato PDF com formatação profissional",
  sort_order: 1
)
```

### API Endpoints

#### Listar Features
```bash
GET /api/admin/features

# Response
[
  {
    id: 1,
    key: "export_pdf",
    label: "Exportar PDF",
    description: "..."
  },
  ...
]
```

#### Criar Feature
```bash
POST /api/admin/features

Body:
{
  "key": "collaboration",
  "label": "Collaboração em Tempo Real",
  "description": "Trabalhe com outros usuários simultaneamente",
  "sort_order": 2
}
```

#### Listar Planos com Features
```bash
GET /api/admin/plans

# Response
[
  {
    id: 1,
    name: "Free",
    description: "...",
    price: 0,
    features: ["view_songs", "basic_search"],
    features_full: [
      { id: 1, key: "view_songs", label: "Ver Acordes" },
      ...
    ]
  },
  ...
]
```

#### Criar Plano com Features
```bash
POST /api/admin/plans

Body:
{
  "name": "Premium",
  "description": "Acesso completo",
  "price_cents": 9999,
  "duration_days": 30,
  "interval": "month",
  "features": ["export_pdf", "collaboration", "storage_increase"]
}
```

#### Atualizar Features de um Plano
```bash
PATCH /api/admin/plans/:id/update_features

Body:
{
  "feature_ids": [1, 2, 3, 4]
}
```

---

## 🔍 Verificações de Assinatura

```ruby
# Usuário atual
subscription = current_user.current_subscription

# Status
subscription.active?              # Ativa e não expirada
subscription.expired?             # Passou da data
subscription.cancelled?           # Foi cancelada manualmente

# Informações
subscription.plan.name            # "Premium"
subscription.plan.features        # Collection de features
subscription.expires_at           # Data de expiração
subscription.created_at           # Data de início

# Dias restantes
days_remaining = (subscription.expires_at - Time.current).to_i / 86400

# Próxima renovação
if subscription.expires_at > Time.current
  days_until_renewal = ((subscription.expires_at - Time.current) / 86400).ceil
end
```

---

## 🚨 Tratamento de Erros

### Exceções

```ruby
module Features
  class Enforcer
    class FeatureNotAllowed < StandardError; end
  end
end
```

### Tratamento em Controllers

```ruby
def create_export
  current_user.feature_enforcer.check!("export_pdf")
  # ... código
rescue Features::Enforcer::FeatureNotAllowed => e
  render json: { error: e.message }, status: :forbidden
end
```

### Resposta JSON

```json
{
  "error": "Seu plano não inclui: Exportar PDF"
}
```

---

## ✅ Checklist de Implementação

Ao implementar uma nova feature:

- [ ] Criar a feature: `Feature.create!(key: "...", label: "...", description: "...")`
- [ ] Adicionar aos planos: `plan.add_feature("feature_key")`
- [ ] Proteger o endpoint: `require_feature("feature_key")` ou `check!`
- [ ] Adicionar no serializer: retornar flag de acesso
- [ ] Adicionar no frontend: mostrar/ocultar UI baseado na feature
- [ ] Testar com usuário sem feature (deve retornar 403)
- [ ] Testar com usuário com feature (deve funcionar)
- [ ] Documentar no README do Frontend

---

## 🏗️ Estrutura de Arquivos

```
chord-keeper-web/
├── app/
│   ├── models/
│   │   ├── plan.rb              # ⭐ Plano com methods has_feature?, add_feature
│   │   ├── feature.rb           # ⭐ Feature
│   │   ├── plan_feature.rb      # ⭐ Join table
│   │   ├── user_subscription.rb # ⭐ Assinatura do usuário
│   │   └── user.rb              # Métodos can_use_feature?, feature_enforcer
│   │
│   ├── services/
│   │   └── features/
│   │       └── enforcer.rb      # ⭐ Serviço central de validação
│   │
│   ├── controllers/
│   │   ├── concerns/
│   │   │   └── requires_feature.rb  # Mixin before_action
│   │   └── api/
│   │       ├── admin/
│   │       │   ├── plans_controller.rb
│   │       │   └── features_controller.rb
│   │       └── songs_controller.rb
│   │
│   ├── serializers/
│   │   ├── plan_serializer.rb
│   │   ├── feature_serializer.rb
│   │   └── song_serializer.rb
│   │
│   └── views/
│       └── (ERB templates com feature gates)
│
├── frontend/
│   └── src/
│       ├── services/
│       │   └── api/
│       │       └── billing.ts    # Tipos e chamadas API
│       ├── contexts/
│       │   └── AuthContext.tsx   # Acesso a subscription
│       └── components/
│           ├── FeatureGate.tsx   # Componente reutilizável
│           └── (componentes com feature checks)
│
└── db/
    └── migrations/
        ├── create_plans.rb
        ├── create_features.rb
        └── create_plan_features.rb
```

---

## 📚 Referências

- [Plan Model](app/models/plan.rb)
- [Feature Model](app/models/feature.rb)
- [Features::Enforcer Service](app/services/features/enforcer.rb)
- [RequiresFeature Concern](app/controllers/concerns/requires_feature.rb)
- [Plans API](app/controllers/api/admin/plans_controller.rb)
- [Features API](app/controllers/api/admin/features_controller.rb)

---

## 🎓 Boas Práticas

1. **Nomeie features com clareza**: `export_pdf` é melhor que `exp_pdf` ou `feature_1`
2. **Validate sempre no backend**: Nunca confie apenas no frontend
3. **Use `check!()` para ações críticas**: Mais seguro que `can_use_feature?`
4. **Documente visualmente no frontend**: Mostre por que uma ação está bloqueada
5. **Log de acessos negados**: Ajuda a debugar e entender uso
6. **Teste com usuários sem feature**: Garanta que retorna 403 corretamente
7. **Comunique upgrades de forma clara**: "Essa feature requer plano X"

---

## 📊 Exemplo Avançado: Limitar Número de Cifras por Plano

Este é um caso de uso comum onde diferentes planos têm limites diferentes de recursos.

### Arquitetura

```
User → UserSubscription → Plan → Features/Quotas
        ↓
     Libraries → Songs
```

**Planos de exemplo:**
- Free: 10 cifras
- Premium: 100 cifras
- Professional: Ilimitado

### 1. Criar Feature com Limite

```bash
# Via Rails Console
Feature.create!(
  key: "song_limit",
  label: "Limite de Cifras",
  description: "Número máximo de cifras que pode ser criado",
  sort_order: 1
)

# Criar planos com diferentes limites
free_plan = Plan.create!(
  name: "Free",
  price_cents: 0,
  duration_days: 999999,  # Indefinido
  interval: "month",
  active: true
)

premium_plan = Plan.create!(
  name: "Premium",
  price_cents: 9999,
  duration_days: 30,
  interval: "month",
  active: true
)

professional_plan = Plan.create!(
  name: "Professional",
  price_cents: 29999,
  duration_days: 30,
  interval: "month",
  active: true
)

# Adicionar feature a todos
[free_plan, premium_plan, professional_plan].each { |p| p.add_feature("song_limit") }
```

### 2. Criar Serviço de Quota

```ruby
# app/services/quota/song_limit_service.rb
module Quota
  class SongLimitService
    PLAN_LIMITS = {
      "Free" => 10,
      "Premium" => 100,
      "Professional" => nil  # nil = ilimitado
    }.freeze

    def initialize(user)
      @user = user
      @plan = user.current_subscription&.plan
    end

    # Limite em números
    def limit
      return nil if @plan.nil?
      PLAN_LIMITS[@plan.name]
    end

    # Label do limite
    def limit_label
      limit.nil? ? "Ilimitado" : "#{limit} cifras"
    end

    # Quantas cifras o usuário criou
    def songs_count
      @user.owned_libraries.joins(:songs).count(:songs, distinct: true)
    end

    # Quantas mais pode criar
    def available_count
      return Float::INFINITY if limit.nil?
      limit - songs_count
    end

    # Percentual de uso
    def usage_percentage
      return 0.0 if limit.nil?
      (songs_count.to_f / limit * 100).round(2)
    end

    # Pode criar mais?
    def can_create?
      return true if limit.nil?
      songs_count < limit
    end

    # Mensagem de erro
    def error_message
      "Você atingiu o limite de #{limit_label} do seu plano. " \
      "Você tem #{songs_count} cifra(s). " \
      "#{link_to 'Fazer upgrade?', plans_path}"
    end

    # Status detalhado
    def status
      {
        plan: @plan&.name,
        limit: limit,
        limit_label: limit_label,
        used: songs_count,
        available: available_count,
        percentage: usage_percentage,
        can_create: can_create?
      }
    end
  end
end
```

### 3. Validação no Controller

```ruby
# app/controllers/api/songs_controller.rb
class Api::SongsController < Api::ApiController
  before_action :check_song_limit, only: [:create]

  def create
    @song = Song.new(song_params)
    @song.library = current_library

    if @song.save
      render json: SongSerializer.new(@song, { include: [:media_references] }).serializable_hash, 
             status: :created, 
             location: @song
    else
      render json: @song.errors, status: :unprocessable_entity
    end
  end

  private

  def check_song_limit
    quota = Quota::SongLimitService.new(current_user)
    
    unless quota.can_create?
      return render json: {
        error: quota.error_message,
        quota: quota.status
      }, status: :unprocessable_entity
    end
  end
end
```

### 4. Modelo User - Helper Methods

```ruby
# app/models/user.rb
class User < ApplicationRecord
  def song_quota
    @song_quota ||= Quota::SongLimitService.new(self)
  end

  def can_create_song?
    song_quota.can_create?
  end

  def song_limit
    song_quota.limit
  end

  def songs_count
    song_quota.songs_count
  end

  def owned_libraries
    Library.where(owner_id: id)
  end
end
```

### 5. Serializer - Incluir Info de Quota

```ruby
# app/serializers/user_serializer.rb
class UserSerializer < ApplicationSerializer
  include Rails.application.routes.url_helpers

  attributes :id, :email, :role, :subscription_data, :quota_info

  def subscription_data
    subscription = object.current_subscription
    return nil unless subscription

    {
      plan: subscription.plan.name,
      features: subscription.plan.features.pluck(:key),
      expires_at: subscription.expires_at,
      status: subscription.status
    }
  end

  def quota_info
    object.song_quota.status
  end
end
```

### 6. Frontend - Mostrar Limite

#### React Hook
```typescript
// hooks/useSongQuota.ts
import { useAuth } from '@/contexts/AuthContext';

export function useSongQuota() {
  const { user } = useAuth();
  
  const quota = user?.quota_info;
  const isNearLimit = quota && quota.percentage > 80;
  const isAtLimit = quota && !quota.can_create;
  
  return {
    quota,
    isNearLimit,
    isAtLimit,
    percentageText: `${quota?.percentage || 0}%`
  };
}
```

#### Component - Mostrar Status
```typescript
// components/SongQuotaStatus.tsx
import { useSongQuota } from '@/hooks/useSongQuota';

export function SongQuotaStatus() {
  const { quota, isNearLimit, isAtLimit } = useSongQuota();
  
  if (!quota) return null;

  return (
    <div className={`p-4 rounded-lg ${
      isAtLimit ? 'bg-red-100 border border-red-300' :
      isNearLimit ? 'bg-yellow-100 border border-yellow-300' :
      'bg-blue-100 border border-blue-300'
    }`}>
      <p className="font-semibold">
        {quota.plan} • {quota.used}/{quota.limit_label}
      </p>
      
      {/* Barra de progresso */}
      <div className="w-full bg-gray-300 rounded-full h-2 mt-3">
        <div
          className={`h-full rounded-full transition-all ${
            isAtLimit ? 'bg-red-500' :
            isNearLimit ? 'bg-yellow-500' :
            'bg-blue-500'
          }`}
          style={{ width: `${Math.min(quota.percentage, 100)}%` }}
        />
      </div>
      
      <p className="text-sm mt-2">
        {isAtLimit ? (
          <>
            🚫 Limite atingido. 
            <a href="/plans" className="underline ml-1">Fazer upgrade?</a>
          </>
        ) : isNearLimit ? (
          `⚠️ Você está usando ${quota.percentage}% da sua cota`
        ) : (
          `✅ Você tem ${quota.available} cifra(s) disponível(eis)`
        )}
      </p>
    </div>
  );
}
```

#### Component - Bloqueio de Criação
```typescript
// components/SongFormWithQuotaCheck.tsx
import { useSongQuota } from '@/hooks/useSongQuota';

interface Props {
  onSubmit: (data: SongData) => Promise<void>;
}

export function SongFormWithQuotaCheck({ onSubmit }: Props) {
  const { quota } = useSongQuota();

  if (!quota?.can_create) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          🔒 Limite de Cifras Atingido
        </h2>
        <p className="text-gray-600 mb-6">
          Seu plano <strong>{quota?.plan}</strong> permite até{' '}
          <strong>{quota?.limit_label}</strong>.
        </p>
        <p className="text-gray-500 mb-8">
          Você criou <strong>{quota?.used}</strong> cifra(s).
        </p>
        <button
          onClick={() => window.location.href = '/plans'}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          📈 Fazer Upgrade de Plano
        </button>
      </div>
    );
  }

  return (
    <>
      <SongQuotaStatus />
      <SongForm onSubmit={onSubmit} />
    </>
  );
}
```

### 7. Teste

```ruby
# spec/services/quota/song_limit_service_spec.rb
RSpec.describe Quota::SongLimitService do
  let(:user) { create(:user) }
  let(:free_plan) { create(:plan, name: "Free") }
  let(:premium_plan) { create(:plan, name: "Premium") }

  before do
    create(:user_subscription, user: user, plan: free_plan)
  end

  describe "#can_create?" do
    context "when user has free plan with 10 song limit" do
      it "allows creation when under limit" do
        create_list(:song, 9, library: user.owned_libraries.first)
        service = described_class.new(user)
        
        expect(service.can_create?).to be true
        expect(service.songs_count).to eq 9
      end

      it "denies creation when at limit" do
        create_list(:song, 10, library: user.owned_libraries.first)
        service = described_class.new(user)
        
        expect(service.can_create?).to be false
        expect(service.available_count).to eq 0
      end
    end

    context "when user upgrades to premium (unlimited)" do
      it "allows unlimited songs" do
        create(:user_subscription, user: user, plan: premium_plan)
        create_list(:song, 1000, library: user.owned_libraries.first)
        
        service = Quota::SongLimitService.new(user.reload)
        
        expect(service.can_create?).to be true
        expect(service.limit).to be nil
      end
    end
  end

  describe "#usage_percentage" do
    it "calculates correct percentage" do
      create_list(:song, 5, library: user.owned_libraries.first)
      service = described_class.new(user)
      
      expect(service.usage_percentage).to eq 50.0  # 5 de 10
    end
  end
end
```

### 8. Migração de Dados (Adicionar ao Plan)

Se você já tem planos criados:

```ruby
# db/seeds.rb ou migration
Plan.all.each do |plan|
  plan.add_feature("song_limit") unless plan.has_feature?("song_limit")
end
```

### Resumo de Implementação

| Componente | Aqui |
|-----------|------|
| Backend | `app/services/quota/song_limit_service.rb` |
| Controller | `app/controllers/api/songs_controller.rb` |
| Model | `app/models/user.rb` (helpers) |
| Serializer | `app/serializers/user_serializer.rb` |
| Frontend | `components/SongQuotaStatus.tsx`, `components/SongFormWithQuotaCheck.tsx` |
| Testes | `spec/services/quota/song_limit_service_spec.rb` |

### Endpoints Resultantes

```bash
# GET - Verificar quota do usuário
GET /api/subscription/quota

Response:
{
  "plan": "Premium",
  "limit": 100,
  "used": 42,
  "available": 58,
  "percentage": 42.0,
  "can_create": true
}

# POST - Criar cifra (com validação de limite)
POST /api/songs
Response 201: { song data }                          # Se pode criar
Response 422: { error: "Limite atingido...", quota: {...} }  # Se não pode
```

---

**Última atualização:** Abril 2026
