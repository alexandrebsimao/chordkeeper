# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).

# Criar planos padrão
puts "Criando planos..."

plans_data = [
  {
    name: 'Free',
    price_cents: 0,
    interval: 'month',
    max_songs: 20,
    max_setlists: 3,
    max_collaborators: 1,
    features: [],
    active: true,
    sort_order: 0
  },
  {
    name: 'Starter',
    price_cents: 499, # R$ 4.99
    interval: 'month',
    max_songs: 100,
    max_setlists: nil, # Ilimitadas
    max_collaborators: 1,
    features: ['public_sharing', 'auto_scroll', 'transpose'],
    active: true,
    sort_order: 1
  },
  {
    name: 'Pro',
    price_cents: 999, # R$ 9.99
    interval: 'month',
    max_songs: nil, # Ilimitadas
    max_setlists: nil, # Ilimitadas
    max_collaborators: 5,
    features: ['public_sharing', 'auto_scroll', 'transpose', 'pdf_export', 'collaboration', 'templates'],
    active: true,
    sort_order: 2
  },
  {
    name: 'Team',
    price_cents: 2999, # R$ 29.99
    interval: 'month',
    max_songs: nil, # Ilimitadas
    max_setlists: nil, # Ilimitadas
    max_collaborators: 10,
    features: ['public_sharing', 'auto_scroll', 'transpose', 'pdf_export', 'collaboration', 'templates', 'api_access', 'analytics'],
    active: true,
    sort_order: 3
  }
]

plans_data.each do |plan_data|
  plan = Plan.find_or_create_by(name: plan_data[:name]) do |p|
    p.assign_attributes(plan_data)
  end
  puts "  ✓ Plano #{plan.name} criado/atualizado"
end

# Criar feature flags
puts "\nCriando feature flags..."

features_data = [
  {
    key: 'public_sharing',
    name: 'Compartilhamento Público',
    description: 'Permite gerar links públicos para compartilhar setlists',
    enabled: true,
    allowed_plans: ['Starter', 'Pro', 'Team']
  },
  {
    key: 'auto_scroll',
    name: 'Scroll Automático',
    description: 'Controle de velocidade de scroll automático',
    enabled: true,
    allowed_plans: ['Starter', 'Pro', 'Team']
  },
  {
    key: 'transpose',
    name: 'Transposição de Tom',
    description: 'Transpor músicas para diferentes tons',
    enabled: true,
    allowed_plans: ['Starter', 'Pro', 'Team']
  },
  {
    key: 'pdf_export',
    name: 'Exportação PDF',
    description: 'Exportar setlists e músicas em PDF',
    enabled: true,
    allowed_plans: ['Pro', 'Team']
  },
  {
    key: 'collaboration',
    name: 'Colaboração em Tempo Real',
    description: 'Múltiplos usuários editando simultaneamente',
    enabled: false,
    allowed_plans: ['Pro', 'Team']
  },
  {
    key: 'templates',
    name: 'Templates Personalizados',
    description: 'Criar templates customizados para setlists',
    enabled: false,
    allowed_plans: ['Pro', 'Team']
  },
  {
    key: 'api_access',
    name: 'Acesso à API',
    description: 'Integração via API REST',
    enabled: false,
    allowed_plans: ['Team']
  },
  {
    key: 'analytics',
    name: 'Analytics e Relatórios',
    description: 'Relatórios de uso e analytics',
    enabled: false,
    allowed_plans: ['Team']
  }
]

features_data.each do |feature_data|
  feature = FeatureFlag.find_or_create_by(key: feature_data[:key]) do |f|
    f.assign_attributes(feature_data)
  end
  puts "  ✓ Feature #{feature.name} criada/atualizada"
end

# Criar usuário admin padrão (se não existir)
puts "\nCriando usuário admin..."

puts "\n✅ Seeds concluídos!"
puts "\n📊 Resumo:"
puts "  - Planos: #{Plan.count}"
puts "  - Features: #{FeatureFlag.count}"
puts "  - Usuários Admin: #{User.admins.count}"

