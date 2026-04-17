class SubscriptionNotification < ApplicationRecord
  KINDS = %w[expiry_reminder renewal_suggestion payment_issue].freeze

  belongs_to :user
  belongs_to :user_subscription

  validates :kind, inclusion: { in: KINDS }
  validates :title, :message, presence: true

  scope :unread, -> { where(read_at: nil) }
  scope :recent, -> { order(created_at: :desc) }
end
