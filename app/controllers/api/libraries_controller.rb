class Api::LibrariesController < Api::ApiController
  # skip_before_action :verify_authenticity_token
  before_action :authenticate_user!
  
  # GET /api/libraries
  def index
    libraries = current_user.accessible_libraries.includes(:library_users)
    current_lib = current_user.current_library
    
    # Adicionar informação de permissão para cada biblioteca
    libraries_with_permissions = libraries.map do |library|
      {
        id: library.id,
        name: library.name,
        description: library.description,
        owner_id: library.owner_id,
        permission: library.permission_for(current_user),
        is_current: current_lib&.id == library.id
      }
    end
    
    render json: { data: libraries_with_permissions }
  end
  
  # GET /api/libraries/:id
  def show
    library = current_user.accessible_libraries.find(params[:id])
    
    render json: {
      data: {
        id: library.id,
        attributes: {
          name: library.name,
          description: library.description,
          owner_id: library.owner_id,
          permission: library.permission_for(current_user)
        }
      }
    }
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Biblioteca não encontrada ou você não tem acesso' }, status: :not_found
  end

  def define_scope
    library = current_user.accessible_libraries.find(params[:id])
    
    if current_user.set_current_library(library)
      render json: { 
        message: "Biblioteca alterada para #{library.name}.",
        current_library_id: library.id 
      }, status: :ok
    else
      render json: { error: 'Não foi possível definir a biblioteca' }, status: :unprocessable_entity
    end
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Biblioteca não encontrada ou você não tem acesso' }, status: :not_found
  end
end
