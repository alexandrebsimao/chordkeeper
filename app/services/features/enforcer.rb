module Features
  class Enforcer
    def initialize(user)
      @user = user
      @plan = user.current_subscription&.plan
    end

    def check(feature_key)
      return false if @plan.nil?
      @plan.has_feature?(feature_key)
    end

    def check!(feature_key)
      unless check(feature_key)
        feature = Feature.find_by_key(feature_key)
        feature_label = feature&.label || feature_key
        raise FeatureNotAllowed, "Seu plano não inclui: #{feature_label}"
      end

      true
    end

    def enabled_features
      return [] if @plan.nil?
      @plan.features.pluck(:key)
    end

    def feature_label(feature_key)
      feature = Feature.find_by_key(feature_key)
      feature&.label || feature_key
    end

    def all_features
      Feature.ordered
    end

    class FeatureNotAllowed < StandardError; end
  end
end

