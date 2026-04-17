# Feature Flags - Uso e Exemplos

## Estrutura

Features agora são gerenciadas via tabela `features` e relacionadas aos planos através da tabela `plan_features`.

```
Features Table:
  id | key                   | label                    | description
  1  | export_pdf           | Exportar para PDF        | ...
  2  | mobile_app_access    | Acesso ao App Mobile     | ...
  3  | team_management      | Gerenciamento de Equipe  | ...
  ...

Plan Features Table (M-to-M):
  plan_id | feature_id
  2       | 1          (Pro tem export_pdf)
  2       | 2          (Pro tem mobile_app)
  4       | 1,2,3,4,5,6 (Premium tem todas)
```

## Modelo Plan

```ruby
class Plan
  has_many :plan_features, dependent: :destroy
  has_many :features, through: :plan_features

  # Verificar se plano tem feature
  plan.has_feature?(:export_pdf)           # => true/false

  # Adicionar feature
  plan.add_feature(:export_pdf)            # => true

  # Remover feature
  plan.remove_feature(:mobile_app_access)  # => true

  # Listar features do plano
  plan.features_list                       # => [{key, label, description, enabled: true}, ...]

  # Contar features
  plan.features.count                      # => 3
end
```

## Modelo Feature

```ruby
class Feature
  has_many :plan_features, dependent: :destroy
  has_many :plans, through: :plan_features

  # Buscar por chave
  Feature.find_by_key(:export_pdf)         # => Feature object

  # Listar ordenado
  Feature.ordered                          # => [Feature, Feature, ...]
end
```

## Verificar Acesso a Feature

### No Console

```ruby
user = User.first
enforcer = user.feature_enforcer

# Verificar se pode usar
enforcer.check(:export_pdf)                # => true/false

# Com exceção
enforcer.check!(:api_access)               # => erro se não permitido

# Obter todas habilitadas
enforcer.enabled_features                  # => [:export_pdf, :mobile_app_access]

# Obter label da feature
enforcer.feature_label(:export_pdf)        # => "Exportar para PDF"

# Listar todas as features existentes
enforcer.all_features                      # => [Feature, Feature, ...]
```

### Em Controllers

```ruby
class SongsController < ApplicationController
  include Concerns::RequiresFeature

  def export_pdf
    require_feature(:export_pdf)  # Lança exceção se não permitido
    # ... continuar com exportação
  end

  def advanced_stats
    if feature_enabled?(:advanced_analytics)
      # ... mostrar analytics avançado
    else
      # ... mostrar analytics básico
    end
  end
end
```

### Em Models

```ruby
class Song < ApplicationRecord
  belongs_to :library

  before_create :validate_song_limit

  def validate_song_limit
    owner = library.owner
    plan = owner.current_subscription&.plan
    
    return if plan.nil? # User sem subscription

    # Verificar limite
    current_count = owner.songs.count
    if current_count >= plan.max_songs
      raise StandardError, "Limite de músicas atingido"
    end

    # Verificar feature
    unless plan.has_feature?(:mobile_app_access)
      raise StandardError, "Seu plano não permite criar músicas via mobile"
    end
  end
end
```

## Adicionar Nova Feature

### Via Seeds ou Migrations

```ruby
# db/seeds.rb ou migration
Feature.create!(
  key: "collaborative_workspace",
  label: "Workspace Colaborativo",
  description: "Editar setlists em tempo real com colaboradores",
  sort_order: 7
)

# Associar ao plano
plan = Plan.find_by(name: "Premium")
plan.add_feature(:collaborative_workspace)
```

### Via Console

```ruby
feature = Feature.create!(
  key: "white_label",
  label: "White Label",
  description: "Customizar branding da aplicação"
)

Plan.where(name: ["Premium", "Premium Annual"]).each do |plan|
  plan.add_feature(:white_label)
end
```

## Admin: Gerenciar Features de um Plano

```ruby
plan = Plan.find_by(name: "Pro")

# Ver features atuais
plan.features.pluck(:label)
# => ["Exportar para PDF", "Acesso ao App Mobile"]

# Adicionar nova feature
plan.add_feature(:team_management)
# => true

# Remover feature
plan.remove_feature(:mobile_app_access)
# => true

# Verificar feature
plan.has_feature?(:export_pdf)
# => true
```

## API Response

```json
{
  "data": [
    {
      "id": "2",
      "type": "plan",
      "attributes": {
        "name": "Pro",
        "price_cents": 999,
        "features_list": [
          {
            "key": "export_pdf",
            "label": "Exportar para PDF",
            "description": "Exportar...",
            "enabled": true
          },
          {
            "key": "mobile_app_access",
            "label": "Acesso ao App Mobile",
            "description": "Acesso...",
            "enabled": true
          }
        ]
      }
    }
  ]
}
```

## Migration para Adicionar Feature

```ruby
# db/migrate/TIMESTAMP_add_collaboration_feature.rb
class AddCollaborationFeature < ActiveRecord::Migration[7.1]
  def up
    feature = Feature.create!(
      key: "collaboration",
      label: "Colaboração em Tempo Real",
      sort_order: 7
    )

    # Associar apenas ao Premium
    premium_plans = Plan.where(name: ["Premium", "Premium Annual"])
    premium_plans.each { |plan| plan.plan_features.create!(feature: feature) }
  end

  def down
    Feature.find_by_key("collaboration")&.destroy
  end
end
```

## Troubleshooting

### Feature não aparece no plano

```ruby
# Verificar se feature existe
Feature.find_by_key(:export_pdf)

# Verificar se está associada
plan.has_feature?(:export_pdf)

# Verificar relacionamento
plan.plan_features.count
plan.features.count
```

### Feature checking retorna false quando deveria ser true

```ruby
# Verificar subscription do usuário
user.current_subscription.plan.has_feature?(:export_pdf)

# Verificar período de billing (mensal vs anual)
user.current_subscription.plan.name

# Verificar ativo
user.current_subscription.status
```
