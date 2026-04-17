class PlanFeature < ApplicationRecord
  belongs_to :plan
  belongs_to :feature

  validates :plan_id, uniqueness: { scope: :feature_id }
end
