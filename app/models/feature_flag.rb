class FeatureFlag < ApplicationRecord
  # Serialization
  serialize :allowed_plans, coder: JSON
  serialize :config, coder: JSON

  # Validations
  validates :key, presence: true, uniqueness: true
  validates :name, presence: true

  # Scopes
  scope :enabled, -> { where(enabled: true) }

  # Methods
  def available_for_plan?(plan_name)
    return true if allowed_plans.blank? # If no plans specified, available for all
    allowed_plans.include?(plan_name)
  end

  def available_for_user?(user)
    return false unless enabled?
    return true if allowed_plans.blank?
    
    user_plan = user.current_plan&.name
    return false if user_plan.nil?
    
    allowed_plans.include?(user_plan)
  end
end
