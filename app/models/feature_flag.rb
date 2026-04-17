class FeatureFlag < ApplicationRecord
  validates :key, presence: true, uniqueness: true
  validates :name, presence: true

  scope :enabled, -> { where(enabled: true) }
  scope :ordered, -> { order(:name) }

  def allowed_plan_ids
    return [] if allowed_plans.blank?

    JSON.parse(allowed_plans)
  rescue JSON::ParserError
    []
  end

  def allowed_plan_ids=(value)
    self.allowed_plans = Array(value).map(&:to_i).uniq.to_json
  end

  def enabled_for_plan?(plan_id)
    enabled? && allowed_plan_ids.include?(plan_id.to_i)
  end
end
