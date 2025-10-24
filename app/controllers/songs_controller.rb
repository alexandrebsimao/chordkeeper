class SongsController < ApplicationController
  before_action :set_song, only: %i[ show edit update destroy ]

  # GET /songs or /songs.json
  def index
    @songs = Song.where(library_id: current_library.id)
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
    @song.destroy!

    respond_to do |format|
      format.html { redirect_to songs_path, status: :see_other, notice: "Música excluída com sucesso." }
      format.json { head :no_content }
    end
  end

  def generate_pdf
    @song = Song.find(params[:id])

    pdf = Songs::GeneratePdf.call(@song)
  
    send_data pdf.to_pdf,
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
    end

    # Only allow a list of trusted parameters through.
    def song_params
      params.require(:song).permit(:title, :artist, :genre, :original_key, :transpose_key, :bpm, :attachment,
                                 :content)
    end

end
