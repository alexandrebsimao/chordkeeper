module Api::Admin
  class FeatureFlagsController < BaseController
    before_action :set_feature_flag, only: [:show, :update, :destroy, :toggle]

    def index
      @feature_flags = FeatureFlag.order(:key)
      render json: @feature_flags
    end

    def show
      render json: @feature_flag
    end

    def create
      @feature_flag = FeatureFlag.new(feature_flag_params)
      
      if @feature_flag.save
        render json: @feature_flag, status: :created
      else
        render json: { errors: @feature_flag.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def update
      if @feature_flag.update(feature_flag_params)
        render json: @feature_flag
      else
        render json: { errors: @feature_flag.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def toggle
      @feature_flag.update(enabled: !@feature_flag.enabled)
      render json: @feature_flag
    end

    def destroy
      if @feature_flag.destroy
        head :no_content
      else
        render json: { errors: @feature_flag.errors.full_messages }, status: :unprocessable_entity
      end
    end

    private

    def set_feature_flag
      @feature_flag = FeatureFlag.find(params[:id])
    end

    def feature_flag_params
      params.require(:feature_flag).permit(
        :key, :name, :description, :enabled, 
        allowed_plans: [], 
        config: {}
      )
    end
  end
end
