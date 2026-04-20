class Api::SetlistUsersController < Api::ApiController
  # skip_before_action :verify_authenticity_token
  before_action :authenticate_user!
  before_action :set_setlist
  before_action :authorize_owner!, only: [:create, :update, :destroy]
  before_action :set_setlist_user, only: [:update, :destroy]

  # GET /api/setlists/:setlist_id/users
  def index
    @setlist_users = @setlist.setlist_users.where("role != ?", "owner").includes(:user)
    render json: SetlistUserSerializer.new(@setlist_users, include: [:user]).serializable_hash.to_json
  end

  # POST /api/setlists/:setlist_id/users
  def create
    user = User.find_by(email: setlist_user_params[:email])
    
    unless user
      render json: { error: "Usuário não encontrado" }, status: :not_found
      return
    end

    @setlist_user = @setlist.setlist_users.build(
      user: user,
      role: setlist_user_params[:permission] || "read_only"
    )

    if @setlist_user.save
      render json: SetlistUserSerializer.new(@setlist_user, include: [:user]).serializable_hash.to_json, status: :created
    else
      render json: { errors: @setlist_user.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # PATCH /api/setlists/:setlist_id/users/:id
  def update
    if @setlist_user.update(role: setlist_user_params[:permission])
      render json: SetlistUserSerializer.new(@setlist_user, include: [:user]).serializable_hash.to_json
    else
      render json: { errors: @setlist_user.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # DELETE /api/setlists/:setlist_id/users/:id
  def destroy
    @setlist_user.destroy
    head :no_content
  end

  private

  def set_setlist
    # IDOR Fix: Validar que o usuário tem acesso ao setlist
    # Buscar apenas setlists da biblioteca atual ou compartilhados com o usuário
    @setlist = Setlist.where(library_id: current_library.id, id: params[:setlist_id]).first
    @setlist ||= Setlist.joins(:setlist_users).where(setlist_users: { user_id: current_user.id }, id: params[:setlist_id]).first
    
    if @setlist.nil?
      render json: { error: 'Setlist não encontrado ou você não tem acesso' }, status: :not_found
    end
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Setlist não encontrado ou você não tem acesso' }, status: :not_found
  end

  def set_setlist_user
    @setlist_user = @setlist.setlist_users.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Compartilhamento não encontrado' }, status: :not_found
  end

  def authorize_owner!
    unless @setlist.owner_id == current_user.id
      render json: { error: 'Apenas o dono pode gerenciar compartilhamentos' }, status: :forbidden
    end
  end

  def setlist_user_params
    params.require(:setlist_user).permit(:email, :permission)
  end
end
