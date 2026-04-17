class Feature < ApplicationRecord
  has_many :plan_features, dependent: :destroy
  has_many :plans, through: :plan_features

  validates :key, presence: true, uniqueness: true
  validates :label, presence: true

  scope :ordered, -> { order(sort_order: :asc, label: :asc) }

  def self.find_by_key(key)
    find_by(key: key)
  end
end
