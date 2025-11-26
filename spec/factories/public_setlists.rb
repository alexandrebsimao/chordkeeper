FactoryBot.define do
  factory :public_setlist do
    uuid { SecureRandom.uuid }
    association :setlist
  end
end
