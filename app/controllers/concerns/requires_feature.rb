module Concerns
  module RequiresFeature
    extend ActiveSupport::Concern

    included do
      before_action :check_feature_access, only: []
    end

    def require_feature(feature_name)
      current_user.feature_enforcer.check!(feature_name)
    rescue Features::Enforcer::FeatureNotAllowed => e
      render json: { error: e.message }, status: :forbidden
    end

    def feature_enabled?(feature_name)
      current_user.can_use_feature?(feature_name)
    end
  end
end
