class SongsController < ApplicationController
  before_action :set_song, only: %i[ show edit update destroy ]
  before_action :check_edit_permission, only: %i[ new create edit update destroy ]

  # GET /songs or /songs.json
  def index
    @songs = Songs::ListSongsService.new(
      conditions: { 
        equal: {
          library_id: current_library.id
        },
        like: {
          title: params[:search].present? ? params[:search].downcase : nil,
          artist: params[:search].present? ? params[:search].downcase : nil
        }
      },
      page: params[:page],
      per_page: 9
    ).call
  end

  # GET /songs/1 or /songs/1.json
  def show
  end

  # GET /songs/new
  def new
    @song = Song.new
  end

  # GET /songs/1/edit
  def edit
  end

  # POST /songs or /songs.json
  def create
    @song = Song.new(song_params)
    @song.library = current_library

    respond_to do |format|
      if @song.save
        format.html { redirect_to @song, notice: "Música criada com sucesso." }
        format.json { render :show, status: :created, location: @song }
      else
        format.html { render :new, status: :unprocessable_entity }
        format.json { render json: @song.errors, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /songs/1 or /songs/1.json
  def update
    respond_to do |format|
      if @song.update(song_params)
        format.html { redirect_to @song, notice: "Música atualizada com sucesso." }
        format.json { render :show, status: :ok, location: @song }
      else
        format.html { render :edit, status: :unprocessable_entity }
        format.json { render json: @song.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /songs/1 or /songs/1.json
  def destroy
    if @song.setlists.any?
      respond_to do |format|
        format.html { redirect_to songs_path, status: :see_other, alert: "Não é possível excluir a música pois ela está associada a um ou mais setlists." }
        format.json { head :no_content }
      end
      return
    end

    @song.destroy!

    respond_to do |format|
      format.html { redirect_to songs_path, status: :see_other, notice: "Música excluída com sucesso." }
      format.json { head :no_content }
    end
  end

  def generate_pdf
    @song = Song.find(params[:id])

    pdf = Songs::GeneratePdfService.call(@song)
  
    send_data pdf,
              filename: "#{@song.title}.pdf",
              type: "application/pdf",
              disposition: "inline" # ou "attachment" para download
  end

  def transpose
    song = Song.find(params[:id])
    to_key = params[:transpose_key]

    song.transpose_key = song.original_key == to_key ? nil : to_key
    if song.save
      redirect_to song, notice: "Música transposta para #{to_key} com sucesso."
    else
      redirect_to song, alert: "Erro ao transpor a música."
    end
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_song
      @song = Song.find(params.expect(:id))
      unless @song.library_id == current_library&.id
        redirect_to songs_path, alert: "Você não tem acesso a esta música."
      end
    end

    def check_edit_permission
      unless current_library&.editable_by?(current_user)
        respond_to do |format|
          format.html { redirect_to songs_path, alert: "Você não tem permissão para editar nesta biblioteca." }
          format.json { render json: { error: 'Forbidden' }, status: :forbidden }
        end
      end
    end

    # Only allow a list of trusted parameters through.
    def song_params
      params.require(:song).permit(
        :title, :artist, :genre, :original_key, :bpm, :attachment, :convert_pdf, :content, :capo,
        media_references_attributes: [
          :id, 
          :media_type, 
          :url, 
          :attachment, 
          :description, 
          :_destroy
        ]
      )
    end

end
