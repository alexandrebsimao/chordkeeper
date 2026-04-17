module CookieCsrfProtection
  extend ActiveSupport::Concern

  included do
    before_action :ensure_csrf_token_cookie
  end

  private

  def ensure_csrf_token_cookie
    return unless request.get? || request.head? || request.options?
    return if request.cookie_jar[:csrf_token].present?

    set_csrf_token_cookie
  end

  def verify_csrf_token_for_cookie_auth!
    return unless state_changing_request?
    return if bearer_token_request?

    cookie_token = request.cookie_jar[:csrf_token].to_s
    header_token = request.headers["X-CSRF-Token"].to_s

    valid_tokens =
      cookie_token.present? &&
      header_token.present? &&
      ActiveSupport::SecurityUtils.secure_compare(header_token, cookie_token)

    return if valid_tokens

    render json: { error: "Invalid CSRF token" }, status: :forbidden
  end

  def set_csrf_token_cookie
    request.cookie_jar[:csrf_token] = {
      value: SecureRandom.hex(32),
      httponly: false,
      secure: Rails.env.production?,
      same_site: :strict,
      expires: 1.day.from_now # 🔒 SECURITY: Reduced from 14 days to 24 hours
    }
  end

  def state_changing_request?
    request.post? || request.put? || request.patch? || request.delete?
  end

  def bearer_token_request?
    auth_header = request.headers["Authorization"].to_s
    auth_header.start_with?("Bearer ")
  end
end
