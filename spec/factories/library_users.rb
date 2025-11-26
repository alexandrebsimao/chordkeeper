FactoryBot.define do
  factory :library_user do
    association :user
    association :library
    role { 'editor' }
    is_current_scope { false }
  end
end
