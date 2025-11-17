module Api
  class PlansController < ApiController
    skip_before_action :authenticate_user!, only: [:index]

    # GET /api/plans
    def index
      plans = Plan.active.ordered

      render json: plans.map { |plan|
        {
          id: plan.id,
          name: plan.name,
          price_cents: plan.price_cents,
          interval: plan.interval,
          max_songs: plan.max_songs,
          max_setlists: plan.max_setlists,
          max_collaborators: plan.max_collaborators,
          features: plan.features,
          active: plan.active,
          sort_order: plan.sort_order,
          formatted_price: plan.formatted_price,
          unlimited_songs: plan.unlimited_songs?,
          unlimited_setlists: plan.unlimited_setlists?
        }
      }, status: :ok
    end
  end
end
