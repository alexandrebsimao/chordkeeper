class UserSubscription < ApplicationRecord
  # Associations
  belongs_to :user
  belongs_to :plan

  # Validations
  validates :status, presence: true, inclusion: { in: %w[active cancelled expired trial] }
  validates :started_at, presence: true

  # Scopes
  scope :active, -> { where(status: 'active').where('expires_at IS NULL OR expires_at > ?', Time.current) }
  scope :expired, -> { where(status: 'expired').or(where('expires_at < ?', Time.current)) }
  scope :trial, -> { where(status: 'trial') }
  scope :cancelled, -> { where(status: 'cancelled') }

  # Callbacks
  before_validation :set_started_at, on: :create
  after_create :deactivate_other_subscriptions

  # Methods
  def active?
    status == 'active' && (expires_at.nil? || expires_at > Time.current)
  end

  def expired?
    expires_at.present? && expires_at < Time.current
  end

  def cancel!
    update!(status: 'cancelled', cancelled_at: Time.current)
  end

  def renew!(expires_at:)
    update!(status: 'active', expires_at: expires_at, cancelled_at: nil)
  end

  def days_remaining
    return nil if expires_at.nil?
    ((expires_at - Time.current) / 1.day).ceil
  end

  private

  def set_started_at
    self.started_at ||= Time.current
  end

  def deactivate_other_subscriptions
    user.user_subscriptions
        .where.not(id: id)
        .where(status: 'active')
        .update_all(status: 'cancelled', cancelled_at: Time.current)
  end
end
