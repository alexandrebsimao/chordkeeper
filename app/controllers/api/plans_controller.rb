module Api
  class PlansController < Api::ApiController
    def index
      plans = Plan.active.ordered

      render json: {
        data: plans.map { |plan| serialize_plan(plan) }
      }
    end

    private

    def serialize_plan(plan)
      {
        id: plan.id,
        name: plan.name,
        description: plan.description,
        price_cents: plan.price_cents,
        duration_days: plan.duration_days,
        interval: plan.interval,
        active: plan.active,
        features: plan.features_list
      }
    end
  end
end
