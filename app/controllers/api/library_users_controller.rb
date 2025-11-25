class Api::LibraryUsersController < ApplicationController
  skip_before_action :verify_authenticity_token
  before_action :authenticate_user!
  before_action :set_library
  before_action :authorize_owner!, only: [:create, :update, :destroy]
  before_action :set_library_user, only: [:update, :destroy]

  # GET /api/libraries/:library_id/users
  def index
    @library_users = @library.library_users.includes(:user)
    render json: LibraryUserSerializer.new(@library_users, include: [:user]).serializable_hash.to_json
  end

  # POST /api/libraries/:library_id/users
  def create
    user = User.find_by(email: library_user_params[:email])
    
    unless user
      render json: { error: "Usuário não encontrado" }, status: :not_found
      return
    end

    @library_user = @library.library_users.build(
      user: user,
      role: library_user_params[:permission] || "read_only"
    )

    if @library_user.save
      render json: LibraryUserSerializer.new(@library_user, include: [:user]).serializable_hash.to_json, status: :created
    else
      render json: { errors: @library_user.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # PATCH /api/libraries/:library_id/users/:id
  def update
    if @library_user.update(role: library_user_params[:permission])
      render json: LibraryUserSerializer.new(@library_user, include: [:user]).serializable_hash.to_json
    else
      render json: { errors: @library_user.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # DELETE /api/libraries/:library_id/users/:id
  def destroy
    @library_user.destroy
    head :no_content
  end

  private

  def set_library
    @library = Library.find(params[:library_id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Biblioteca não encontrada' }, status: :not_found
  end

  def set_library_user
    @library_user = @library.library_users.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Compartilhamento não encontrado' }, status: :not_found
  end

  def authorize_owner!
    unless @library.owner_id == current_user.id
      render json: { error: 'Apenas o dono pode gerenciar compartilhamentos' }, status: :forbidden
    end
  end

  def library_user_params
    params.require(:library_user).permit(:email, :permission)
  end
end
