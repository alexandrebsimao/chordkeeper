class LibrariesController < ApplicationController
  before_action :set_library, only: %i[ show edit update destroy ]

  # GET /libraries or /libraries.json
  def index
    @libraries = Library.joins(:library_users).where(library_users: { user_id: current_user.id })
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
    @library.destroy!

    respond_to do |format|
      format.html { redirect_to libraries_path, status: :see_other, notice: "Library was successfully destroyed." }
      format.json { head :no_content }
    end
  end

  def define_scope
    library = Library.joins(:library_users).where(libraries: { id: params[:id] }, library_users: { user_id: current_user.id }).first
    if library.present?
      session[:current_library_id] = library.id
      redirect_to songs_path, notice: "Biblioteca alterada para #{library.name}."
    else
      redirect_to songs_path, alert: "Você não tem acesso a essa biblioteca."
    end
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_library
      @library = Library.find(params.expect(:id))
    end

    # Only allow a list of trusted parameters through.
    def library_params
      params.expect(library: [ :name, :description ])
    end
end
