class PaymentAuditLog < ApplicationRecord
  belongs_to :user
  belongs_to :user_subscription, optional: true

  ACTIONS = {
    subscription_created: 'subscription_created',
    subscription_cancelled: 'subscription_cancelled',
    payment_method_updated: 'payment_method_updated',
    plan_changed: 'plan_changed',
    subscription_renewed: 'subscription_renewed',
    subscription_expired: 'subscription_expired'
  }.freeze

  validates :action, inclusion: { in: ACTIONS.values }
  validates :user_id, presence: true

  # Find recent logs for a user
  scope :recent, -> { order(created_at: :desc) }
  scope :for_user, ->(user) { where(user: user) }
  scope :for_subscription, ->(subscription) { where(user_subscription: subscription) }

  # Log an action with details
  def self.log_action(action:, user:, subscription: nil, details: {}, ip_address: nil, user_agent: nil)
    create!(
      action: action,
      user: user,
      user_subscription: subscription,
      details: details,
      ip_address: ip_address,
      user_agent: user_agent
    )
  end

  # Human-readable action description
  def action_description
    case action
    when ACTIONS[:subscription_created]
      "Assinatura criada"
    when ACTIONS[:subscription_cancelled]
      "Assinatura cancelada"
    when ACTIONS[:payment_method_updated]
      "Método de pagamento atualizado"
    when ACTIONS[:plan_changed]
      "Plano alterado"
    when ACTIONS[:subscription_renewed]
      "Assinatura renovada"
    when ACTIONS[:subscription_expired]
      "Assinatura expirada"
    else
      action
    end
  end
end
