module Api::Admin
  class PlansController < BaseController
    before_action :set_plan, only: [:show, :update, :destroy]

    def index
      @plans = Plan.ordered
      render json: @plans.as_json(methods: [:formatted_price, :unlimited_songs?, :unlimited_setlists?])
    end

    def show
      render json: @plan.as_json(
        methods: [:formatted_price, :unlimited_songs?, :unlimited_setlists?],
        include: { 
          user_subscriptions: { 
            include: { user: { only: [:id, :email] } } 
          } 
        }
      )
    end

    def create
      @plan = Plan.new(plan_params)
      
      if @plan.save
        render json: @plan, status: :created
      else
        render json: { errors: @plan.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def update
      if @plan.update(plan_params)
        render json: @plan
      else
        render json: { errors: @plan.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def destroy
      if @plan.user_subscriptions.any?
        render json: { error: 'Não é possível excluir plano com assinaturas ativas' }, status: :unprocessable_entity
      elsif @plan.destroy
        head :no_content
      else
        render json: { errors: @plan.errors.full_messages }, status: :unprocessable_entity
      end
    end

    private

    def set_plan
      @plan = Plan.find(params[:id])
    end

    def plan_params
      params.require(:plan).permit(
        :name, :price_cents, :interval, :max_songs, :max_setlists, 
        :max_collaborators, :active, :sort_order, features: []
      )
    end
  end
end
