# Be sure to restart your server when you modify this file.

# Define an application-wide content security policy.
# See the Securing Rails Applications Guide for more information:
# https://guides.rubyonrails.org/security.html#content-security-policy-header

Rails.application.configure do
  config.content_security_policy do |policy|
    policy.default_src :self, :https
    policy.font_src    :self, :https, :data
    policy.img_src     :self, :https, :data, :blob
    policy.object_src  :none
    policy.frame_src   :self, :blob
    
    # Allow scripts from self and https sources
    policy.script_src  :self, :https
    
    # Use nonce for inline styles instead of unsafe_inline in production
    # In development, we allow unsafe_inline for easier debugging
    if Rails.env.production?
      policy.style_src :self, :https
    else
      policy.style_src :self, :https, :unsafe_inline
    end
    
    # Allow API connections to configured origins
    allowed_connect_origins = [
      :self, 
      :https,
      ENV.fetch('API_URL', 'http://localhost:3000'),
      ENV.fetch('FRONTEND_URL', 'http://localhost:8080')
    ]
    policy.connect_src(*allowed_connect_origins)
    
    policy.frame_ancestors :self
  end

  # Generate session nonces for permitted importmap, inline scripts, and inline styles.
  config.content_security_policy_nonce_generator = ->(request) { request.session.id.to_s }
  config.content_security_policy_nonce_directives = %w(script-src style-src)

  # Report violations without enforcing the policy in development
  # config.content_security_policy_report_only = true if Rails.env.development?
end
