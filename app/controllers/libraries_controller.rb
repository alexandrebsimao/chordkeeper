class LibrariesController < ApplicationController
  before_action :set_library, only: %i[ show edit update destroy ]

  # GET /libraries or /libraries.json
  def index
    # Mostra bibliotecas próprias e compartilhadas
    @libraries = current_user.accessible_libraries
  end

  # GET /libraries/1 or /libraries/1.json
  def show
  end

  # GET /libraries/new
  def new
    @library = Library.new
  end

  # GET /libraries/1/edit
  def edit
  end

  # POST /libraries or /libraries.json
  def create
    @library = Library.new(library_params)
    @library.users << current_user
    @library.owner = current_user

    respond_to do |format|
      if @library.save
        format.html { redirect_to @library, notice: "Library was successfully created." }
        format.json { render :show, status: :created, location: @library }
      else
        format.html { render :new, status: :unprocessable_entity }
        format.json { render json: @library.errors, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /libraries/1 or /libraries/1.json
  def update
    unless @library.editable_by?(current_user)
      respond_to do |format|
        format.html { redirect_to @library, alert: "Você não tem permissão para editar esta biblioteca." }
        format.json { render json: { error: 'Forbidden' }, status: :forbidden }
      end
      return
    end

    respond_to do |format|
      if @library.update(library_params)
        format.html { redirect_to @library, notice: "Library was successfully updated." }
        format.json { render :show, status: :ok, location: @library }
      else
        format.html { render :edit, status: :unprocessable_entity }
        format.json { render json: @library.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /libraries/1 or /libraries/1.json
  def destroy
    unless @library.owner_id == current_user.id
      respond_to do |format|
        format.html { redirect_to @library, alert: "Apenas o dono pode excluir esta biblioteca." }
        format.json { render json: { error: 'Forbidden' }, status: :forbidden }
      end
      return
    end

    @library.destroy!

    respond_to do |format|
      format.html { redirect_to libraries_path, status: :see_other, notice: "Library was successfully destroyed." }
      format.json { head :no_content }
    end
  end

  def define_scope
    library = current_user.accessible_libraries.find_by(id: params[:id])
    if library.present? && current_user.set_current_library(library)
      session[:current_library_id] = library.id
      redirect_to songs_path, notice: "Biblioteca alterada para #{library.name}."
    else
      redirect_to songs_path, alert: "Você não tem acesso a essa biblioteca."
    end
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_library
      @library = current_user.accessible_libraries.find(params.expect(:id))
    rescue ActiveRecord::RecordNotFound
      respond_to do |format|
        format.html { redirect_to libraries_path, alert: "Biblioteca não encontrada ou você não tem acesso." }
        format.json { render json: { error: 'Not found' }, status: :not_found }
      end
    end

    # Only allow a list of trusted parameters through.
    def library_params
      params.expect(library: [ :name, :description ])
    end
end
