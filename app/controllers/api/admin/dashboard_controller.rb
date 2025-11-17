module Api::Admin
  class DashboardController < BaseController
    def index
      render json: {
        stats: {
          total_users: User.count,
          active_subscriptions: UserSubscription.active.count,
          total_songs: Song.count,
          total_setlists: Setlist.count,
          total_libraries: Library.count,
          revenue_this_month: calculate_monthly_revenue
        },
        recent_users: User.order(created_at: :desc).limit(10).as_json(only: [:id, :email, :created_at, :role]),
        recent_subscriptions: UserSubscription.includes(:user, :plan)
                                              .order(created_at: :desc)
                                              .limit(10)
                                              .as_json(include: { user: { only: [:email] }, plan: { only: [:name, :price_cents] } })
      }
    end

    private

    def calculate_monthly_revenue
      UserSubscription.active
                     .includes(:plan)
                     .sum { |sub| sub.plan.price_cents }
    end
  end
end
