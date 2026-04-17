module AuditablePayment
  extend ActiveSupport::Concern

  private

  # 🔒 Log payment-related actions to audit trail
  def log_audit(action:, subscription: nil, details: {})
    PaymentAuditLog.log_action(
      action: action,
      user: @user,
      subscription: subscription,
      details: details.merge(
        timestamp: Time.current.iso8601,
        service: self.class.name
      ),
      ip_address: extract_ip,
      user_agent: extract_user_agent
    )
  end

  def extract_ip
    # Extract from ActionController context if available
    if defined?(RequestStore)
      RequestStore.store[:current_request_ip]
    end
  end

  def extract_user_agent
    # Extract from ActionController context if available
    if defined?(RequestStore)
      RequestStore.store[:current_user_agent]
    end
  end
end
