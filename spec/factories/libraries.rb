FactoryBot.define do
  factory :library do
    sequence(:name) { |n| "Biblioteca #{n}" }
    association :owner, factory: :user
  end
end
