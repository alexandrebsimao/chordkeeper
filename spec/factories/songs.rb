FactoryBot.define do
  factory :song do
    sequence(:title) { |n| "Música #{n}" }
    artist { 'Artista Exemplo' }
    content { "C G Am F\nLetra da música" }
    association :library
  end
end
