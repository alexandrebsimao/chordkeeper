module Api::Admin
  class UsersController < BaseController
    before_action :set_user, only: [:show, :update, :update_role, :assign_plan]

    def index
      @users = User.includes(:current_plan, :active_subscription)
                   .order(created_at: :desc)
                   .paginate(page: params[:page] || 1, per_page: params[:per_page] || 20)

      render json: {
        users: @users.as_json(
          only: [:id, :email, :created_at, :role],
          methods: [:plan_name, :songs_count, :setlists_count],
          include: {
            current_plan: { only: [:id, :name] },
            active_subscription: { only: [:status, :expires_at] }
          }
        ),
        meta: {
          current_page: @users.current_page,
          total_pages: (@users.count.to_f / @users.per_page).ceil,
          total_count: @users.count
        }
      }
    end

    def show
      render json: @user.as_json(
        only: [:id, :email, :created_at, :updated_at, :role],
        methods: [:plan_name, :songs_count, :setlists_count, :songs_limit, :setlists_limit],
        include: {
          current_plan: { only: [:id, :name, :price_cents] },
          active_subscription: { only: [:status, :started_at, :expires_at, :cancelled_at] },
          libraries: { only: [:id, :name] }
        }
      )
    end

    def update
      if @user.update(user_params)
        render json: @user
      else
        render json: { errors: @user.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def update_role
      if @user.update(role: params[:role])
        render json: { message: 'Role atualizada com sucesso', user: @user }
      else
        render json: { errors: @user.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def assign_plan
      plan = Plan.find(params[:plan_id])
      
      # Calculate expiration date
      expires_at = if plan.interval == 'year'
        1.year.from_now
      else
        1.month.from_now
      end

      subscription = @user.user_subscriptions.build(
        plan: plan,
        status: 'active',
        started_at: Time.current,
        expires_at: expires_at,
        payment_provider: 'manual'
      )

      if subscription.save
        render json: { 
          message: 'Plano atribuído com sucesso', 
          subscription: subscription.as_json(include: :plan) 
        }
      else
        render json: { errors: subscription.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def search
      query = params[:q]
      @users = User.where('email ILIKE ?', "%#{query}%").limit(20)
      
      render json: @users.as_json(
        only: [:id, :email, :role],
        methods: [:plan_name]
      )
    end

    private

    def set_user
      @user = User.find(params[:id])
    end

    def user_params
      params.require(:user).permit(:email, :role)
    end
  end
end
