class UserSubscription < ApplicationRecord
  STATUSES = {
    active: "active",
    cancelled: "cancelled",
    expired: "expired",
    past_due: "past_due"
  }.freeze

  belongs_to :user
  belongs_to :plan
  has_many :subscription_notifications, dependent: :destroy

  validates :status, inclusion: { in: STATUSES.values }
  validates :started_at, presence: true, if: -> { active? }
  validates :expires_at, presence: true, if: -> { active? }

  scope :active, -> { where(status: STATUSES[:active]).where("expires_at >= ?", Time.current) }

  def active?
    status == STATUSES[:active]
  end

  def cancelled?
    status == STATUSES[:cancelled]
  end

  def expires_in_days
    return nil unless expires_at

    ((expires_at.to_date - Date.current).to_i)
  end

  def mark_cancelled!
    update!(status: STATUSES[:cancelled], cancelled_at: Time.current)
  end

  def mark_expired!
    update!(status: STATUSES[:expired])
  end
end
