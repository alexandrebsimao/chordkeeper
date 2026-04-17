class Plan < ApplicationRecord
  INTERVALS = %w[day week month year].freeze

  has_many :user_subscriptions, dependent: :restrict_with_error
  has_many :plan_features, dependent: :destroy
  has_many :features, through: :plan_features

  validates :name, presence: true, uniqueness: true
  validates :description, presence: true
  validates :price_cents, numericality: { greater_than_or_equal_to: 0 }
  validates :duration_days, numericality: { greater_than: 0 }
  validates :interval, inclusion: { in: INTERVALS }

  scope :active, -> { where(active: true) }
  scope :ordered, -> { order(sort_order: :asc, price_cents: :asc) }

  def features_list
    features.ordered.map do |feature|
      {
        key: feature.key,
        label: feature.label,
        description: feature.description,
        enabled: true
      }
    end
  end

  def has_feature?(feature_key)
    features.exists?(key: feature_key)
  end

  def add_feature(feature_key)
    feature = Feature.find_by_key(feature_key)
    return false unless feature

    features << feature unless features.exists?(feature.id)
    true
  end

  def remove_feature(feature_key)
    feature = Feature.find_by_key(feature_key)
    return false unless feature

    features.delete(feature)
    true
  end

  def formatted_price
    format("%.2f", price_cents.to_f / 100.0)
  end
end
