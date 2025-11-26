FactoryBot.define do
  factory :setlist do
    sequence(:title) { |n| "Setlist #{n}" }
    description { 'Descrição do setlist' }
    association :library
  end
end
