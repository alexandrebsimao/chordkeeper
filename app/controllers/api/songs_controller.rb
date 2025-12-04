module Api
  class SongsController < Api::ApiController
  before_action :set_song, only: %i[ show edit update destroy transpose generate_pdf ]
  before_action :authorize_action!, only: %i[ new create edit update destroy ]

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
    per_page: params[:per_page] || 6
    ).call

    render json: SongSerializer.new(@songs, { include: [:media_references] }).serializable_hash
  end

  # GET /songs/1 or /songs/1.json
  def show
    render json: SongSerializer.new(@song, { include: [:media_references] }).serializable_hash
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

    if @song.save
      render json: SongSerializer.new(@song, { include: [:media_references] }).serializable_hash, status: :created, location: @song
    else
      render json: @song.errors, status: :unprocessable_entity
    end
  end

  # PATCH/PUT /songs/1 or /songs/1.json
  def update
    if @song.update(song_params)
      render json: SongSerializer.new(@song, { include: [:media_references] }).serializable_hash, status: :ok, location: @song
    else
      render json: @song.errors, status: :unprocessable_entity
    end
  end

  # DELETE /songs/1 or /songs/1.json
  def destroy
    if @song.setlists.any?
      render json: { error: "Não é possível excluir a música pois ela está associada a um ou mais setlists." }, status: :unprocessable_entity
      return
    end

    @song.destroy!

    render json: { message: "Música excluída com sucesso." }, status: :ok
  end

  def generate_pdf
    @song = Song.find(params[:id])

    font_size = params[:font_size]&.to_i || 16
    pdf = Songs::GeneratePdfService.call(@song, font_size)

    send_data pdf,
            filename: "#{@song.title}.pdf",
            type: "application/pdf",
            disposition: "inline" # ou "attachment" para download
  end

  def transpose
    to_key = params[:transpose_key]

    @song.transpose_key = @song.original_key == to_key ? nil : to_key
    if @song.save
      render json: SongSerializer.new(@song, { include: [:media_references] }).serializable_hash, status: :ok
    else
      render json: { errors: @song.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_song
      @song = Song.where(library_id: current_library.id, id: params[:id]).first
      render json: { error: 'Você não tem acesso a esta música.' }, status: :forbidden and return if @song.nil?
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
end