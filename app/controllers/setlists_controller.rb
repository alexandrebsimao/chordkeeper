class SetlistsController < ApplicationController
  before_action :set_setlist, only: %i[ show edit update destroy manage_songs print save_songs add_song remove_song public_link_generator public_link_destroyer ]
  before_action :check_edit_permission, only: %i[ new create edit update destroy manage_songs save_songs add_song remove_song ]
  before_action :check_share_permission, only: %i[ public_link_generator public_link_destroyer ]

  # GET /setlists or /setlists.json
  def index
    @setlists = Setlists::ListSetlistsService.new(
      conditions: { 
        equal: {
          library_id: current_library.id
        },
        like: {
          title: params[:search].present? ? params[:search].downcase : nil
        }
      },
      page: params[:page],
      per_page: 9
    ).call
  end

  # GET /setlists/1 or /setlists/1.json
  def show
  end

  # GET /setlists/1/manage_songs
  def manage_songs
    @library = @setlist.library
  end

  def public_link_generator
    @setlist.generate_public_setlist!
    public_setlist = @setlist.public_setlist
    
    redirect_to @setlist, notice: "Link público gerado: #{public_setlist_url(public_setlist.uuid)}"
  end

  def public_link_destroyer
    @setlist.public_setlist.destroy if @setlist.public_setlist.present?

    redirect_to @setlist, notice: "Link público removido."
  end

  # GET /setlists/1/print
  def print
    pdf = Setlists::MergePdfService.call(@setlist)
    
    send_data pdf,
            filename: "#{@setlist.title}.pdf",
            type: "application/pdf",
            disposition: "inline"
  end

  # POST /setlists/1/save_songs
  def save_songs
    song_order = params[:song_order]
    if song_order
      @setlist.setlist_songs.destroy_all
      song_order.each_with_index do |song_id, index|
        @setlist.setlist_songs.create(song_id: song_id, position: index + 1)
      end
      head :ok
    else
      head :unprocessable_entity
    end
  end

  # POST /setlists/1/add_song
  def add_song
    begin
      song = Song.find(params[:song_id])
      position = @setlist.setlist_songs.count + 1
      @setlist.setlist_songs.create!(song: song, position: position)
      render json: { song_id: song.id, title: song.title }, status: :created
    rescue ActiveRecord::RecordInvalid, ActiveRecord::RecordNotFound => e
      Rails.logger.error("Erro ao adicionar música: #{e.message}")
      head :unprocessable_entity
    end
  end

  # DELETE /setlists/1/remove_song
  def remove_song
    begin
      song = Song.find(params[:song_id])
      @setlist.songs.delete(song)
      head :ok
    rescue ActiveRecord::RecordNotFound => e
      Rails.logger.error("Erro ao remover música: #{e.message}")
      head :not_found
    end
  end

  # GET /setlists/new
  def new
    @setlist = Setlist.new
  end

  # GET /setlists/1/edit
  def edit
  end

  # POST /setlists or /setlists.json
  def create
    @setlist = Setlist.new(setlist_params)
    @setlist.library = current_library
    @setlist.owner = current_user

    respond_to do |format|
      if @setlist.save
        format.html { redirect_to manage_songs_setlist_path(@setlist), notice: "Setlist criado com sucesso. Agora selecione as músicas ao setlist" }
        format.json { render :show, status: :created, location: @setlist }
      else
        format.html { render :new, status: :unprocessable_entity }
        format.json { render json: @setlist.errors, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /setlists/1 or /setlists/1.json
  def update
    respond_to do |format|
      if @setlist.update(setlist_params)
        format.html { redirect_to @setlist, notice: "Setlist atualizado com sucesso." }
        format.json { render :show, status: :ok, location: @setlist }
      else
        format.html { render :edit, status: :unprocessable_entity }
        format.json { render json: @setlist.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /setlists/1 or /setlists/1.json
  def destroy
    @setlist.destroy!

    respond_to do |format|
      format.html { redirect_to setlists_path, status: :see_other, notice: "Setlist removido com sucesso." }
      format.json { head :no_content }
    end
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_setlist
      @setlist = Setlist.find(params.expect(:id))
      unless @setlist.library_id == current_library&.id
        redirect_to setlists_path, alert: "Você não tem acesso a este setlist."
      end
    end

    def check_edit_permission
      unless current_library&.editable_by?(current_user)
        respond_to do |format|
          format.html { redirect_to setlists_path, alert: "Você não tem permissão para editar nesta biblioteca." }
          format.json { render json: { error: 'Forbidden' }, status: :forbidden }
        end
      end
    end

    def check_share_permission
      unless current_library&.can_share_setlists?(current_user)
        respond_to do |format|
          format.html { redirect_to setlists_path, alert: "Apenas administradores e editores podem compartilhar setlists." }
          format.json { render json: { error: 'Forbidden' }, status: :forbidden }
        end
      end
    end

    # Only allow a list of trusted parameters through.
    def setlist_params
      params.expect(setlist: [ :title, :description, :library_id ])
    end
end
