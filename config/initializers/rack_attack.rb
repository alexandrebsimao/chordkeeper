# 🔒 SECURITY: Rate limiting configuration with Rack::Attack
# Prevents abuse and brute force attacks

class Rack::Attack
  # 🚫 Limit subscription/payment attempts per user
  # Max 5 attempts per minute per IP + user combo
  throttle('payment/subscription_create', limit: 5, period: 60) do |req|
    if req.path == '/api/subscription' && req.post?
      req.ip + '-' + (req.params['user_id'] || 'guest')
    end
  end

  # 🚫 Limit payment method updates
  # Max 3 attempts per minute (more restrictive for credit card changes)
  throttle('payment/update_payment_method', limit: 3, period: 60) do |req|
    if req.path == '/api/subscription/update_payment_method' && req.patch?
      req.ip
    end
  end

  # 🚫 Limit plan changes
  # Max 10 per hour per user (reasonable for legitimate plan changes)
  throttle('payment/change_plan', limit: 10, period: 3600) do |req|
    if req.path == '/api/subscription/change_plan' && req.patch?
      req.ip + '-' + (req.params['user_id'] || 'guest')
    end
  end

  # 🚫 General API throttle - prevent simple DoS
  # Max 100 requests per minute per IP
  throttle('api/general', limit: 100, period: 60) do |req|
    if req.path.start_with?('/api/')
      req.ip
    end
  end

  # 🚫 Login attempt throttle
  # Max 5 login attempts per minute per IP
  throttle('auth/login', limit: 5, period: 60) do |req|
    if req.path == '/users/sign_in' && req.post?
      req.ip
    end
  end

  # Response when limit is reached
  self.throttled_response = lambda { |env|
    retry_after = (env['rack.attack.match_data'] || {})[:period]

    [
      429, # Too Many Requests
      { 
        'Content-Type' => 'application/json',
        'Retry-After' => retry_after.to_s
      },
      [
        {
          error: 'Too many requests. Please try again later.',
          retry_after: retry_after
        }.to_json
      ]
    ]
  }
end
