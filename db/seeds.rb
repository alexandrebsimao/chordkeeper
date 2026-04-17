# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).

# Create features
features_data = [
  { key: "export_pdf", label: "Exportar para PDF", description: "Exportar setlists e músicas em formato PDF", sort_order: 1 },
  { key: "mobile_app_access", label: "Acesso ao App Mobile", description: "Acesso completo ao aplicativo mobile", sort_order: 2 },
  { key: "team_management", label: "Gerenciamento de Equipe", description: "Criar e gerenciar equipes de músicos", sort_order: 3 },
  { key: "advanced_analytics", label: "Analytics Avançado", description: "Visualizar dados analytics detalhados", sort_order: 4 },
  { key: "priority_support", label: "Suporte Prioritário", description: "Atendimento prioritário ao cliente", sort_order: 5 },
  { key: "api_access", label: "Acesso à API", description: "Integração via API REST", sort_order: 6 },
]

features_data.each do |feature_data|
  Feature.find_or_create_by!(key: feature_data[:key]) do |feature|
    feature.update(feature_data)
  end
end

puts "✓ Created #{features_data.length} features"

# Create default subscription plans
plans_data = [
  {
    name: "Free",
    description: "Perfect for getting started with ChordKeeper",
    price_cents: 0,
    interval: "month",
    duration_days: 0,
    max_songs: 50,
    max_setlists: 1,
    max_collaborators: 0,
    sort_order: 1,
    active: true,
    features: []
  },
  {
    name: "Pro",
    description: "For active musicians and teachers - Monthly Billing",
    price_cents: 999,
    interval: "month",
    duration_days: 30,
    max_songs: 999,
    max_setlists: 999,
    max_collaborators: 10,
    sort_order: 2,
    active: true,
    features: ["export_pdf", "mobile_app_access"]
  },
  {
    name: "Pro Annual",
    description: "For active musicians and teachers - Yearly Billing (Save 20%)",
    price_cents: 9999,
    interval: "year",
    duration_days: 365,
    max_songs: 999,
    max_setlists: 999,
    max_collaborators: 10,
    sort_order: 3,
    active: true,
    features: ["export_pdf", "mobile_app_access"]
  },
  {
    name: "Premium",
    description: "For studios and music schools - Monthly Billing",
    price_cents: 2999,
    interval: "month",
    duration_days: 30,
    max_songs: 999,
    max_setlists: 999,
    max_collaborators: 999,
    sort_order: 4,
    active: true,
    features: ["export_pdf", "mobile_app_access", "team_management", "advanced_analytics", "priority_support", "api_access"]
  },
  {
    name: "Premium Annual",
    description: "For studios and music schools - Yearly Billing (Save 20%)",
    price_cents: 29999,
    interval: "year",
    duration_days: 365,
    max_songs: 999,
    max_setlists: 999,
    max_collaborators: 999,
    sort_order: 5,
    active: true,
    features: ["export_pdf", "mobile_app_access", "team_management", "advanced_analytics", "priority_support", "api_access"]
  }
]

plans_data.each do |plan_data|
  features_keys = plan_data.delete(:features) || []

  plan = Plan.find_or_create_by!(name: plan_data[:name]) do |p|
    p.update(plan_data)
  end

  # Associate features
  features_keys.each do |feature_key|
    feature = Feature.find_by_key(feature_key)
    plan.add_feature(feature_key) if feature
  end
end

puts "✓ Created #{plans_data.length} subscription plans"
