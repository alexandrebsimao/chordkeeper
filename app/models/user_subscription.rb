class UserSubscription < ApplicationRecord
  STATUSES = {
    active: "active",
    cancelled: "cancelled",
    expired: "expired",
    past_due: "past_due"  # Falha em renovação, dentro da tolerância de 10 dias
  }.freeze

  belongs_to :user
  belongs_to :plan
  belongs_to :previous_plan, class_name: 'Plan', optional: true
  has_many :subscription_notifications, dependent: :destroy

  validates :status, inclusion: { in: STATUSES.values }
  validates :started_at, presence: true, if: -> { active? }

  # Escopos
  scope :active, -> { where(status: STATUSES[:active]).where("expires_at > ? OR expires_at IS NULL", Time.current) }
  scope :expires_soon, ->(days = 1) { where(status: :active).where("expires_at <= ?", Time.current + days.days) }
  scope :past_due, -> { where(status: STATUSES[:past_due]) }
  scope :in_renewal_tolerance, -> { where(status: :past_due).where("renewal_tolerance_ends_at > ?", Time.current) }
  scope :renewal_tolerance_expired, -> { where(status: :past_due).where("renewal_tolerance_ends_at <= ?", Time.current) }

  def active?
    status == STATUSES[:active] && (expires_at.nil? || expires_at > Time.current)
  end

  def cancelled?
    status == STATUSES[:cancelled]
  end

  def past_due?
    status == STATUSES[:past_due]
  end

  def downgraded?
    downgraded_at.present?
  end

  def expires_in_days
    return nil unless expires_at

    ((expires_at.to_date - Date.current).to_i)
  end

  def renewal_tolerance_ends_in_days
    return nil unless renewal_tolerance_ends_at

    ((renewal_tolerance_ends_at.to_date - Date.current).to_i)
  end

  def mark_cancelled!
    update!(status: STATUSES[:cancelled], cancelled_at: Time.current)
  end

  def mark_expired!
    update!(status: STATUSES[:expired])
  end

  def mark_past_due!
    update!(status: STATUSES[:past_due], renewal_failed_at: Time.current)
  end
end
