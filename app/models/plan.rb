class Plan < ApplicationRecord
  # Associations
  has_many :user_subscriptions, dependent: :restrict_with_error
  has_many :users, through: :user_subscriptions

  # Validations
  validates :name, presence: true, uniqueness: true
  validates :price_cents, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :interval, presence: true, inclusion: { in: %w[month year] }
  validates :max_songs, numericality: { greater_than_or_equal_to: 0, allow_nil: true }
  validates :max_setlists, numericality: { greater_than_or_equal_to: 0, allow_nil: true }
  validates :max_collaborators, presence: true, numericality: { greater_than_or_equal_to: 1 }

  # Serialization
  serialize :features, coder: JSON

  # Scopes
  scope :active, -> { where(active: true) }
  scope :ordered, -> { order(:sort_order, :price_cents) }

  # Methods
  def price
    Money.new(price_cents, 'BRL')
  end

  def free?
    price_cents.zero?
  end

  def has_feature?(feature_key)
    return false if features.blank?
    features.include?(feature_key.to_s)
  end

  def unlimited_songs?
    max_songs.nil?
  end

  def unlimited_setlists?
    max_setlists.nil?
  end

  def display_name
    "#{name} - #{formatted_price}"
  end

  def formatted_price
    return 'Gratuito' if free?
    interval_text = interval == 'year' ? '/ano' : '/mês'
    "R$ #{sprintf('%.2f', price_cents / 100.0)}#{interval_text}"
  end
end
