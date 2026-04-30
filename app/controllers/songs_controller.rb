class SongsController < ApplicationController
  before_action :set_song, only: %i[show edit update destroy transpose generate_pdf]
  before_action :authorize_edit_action!, only: %i[new create edit update destroy]
  before_action :authorize_song_owner!, only: %i[edit update destroy transpose generate_pdf]

  MUSICAL_KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].freeze

  def index
    @search = params[:search].to_s.strip.downcase
    @songs = Songs::ListSongsService.new(
      conditions: {
        equal: { library_id: current_library.id },
        like: {
          title: @search.presence,
          artist: @search.presence
        }
      },
      page: params[:page],
      per_page: params[:per_page] || 12
    ).call
  end

  def show
    @musical_keys = MUSICAL_KEYS
  end

  def new
    @song = Song.new
    @song.media_references.build
  end

  def edit
    @song.media_references.build if @song.media_references.empty?
  end

  def create
    @song = Song.new(song_params)
    @song.library = current_library

    if @song.save
      redirect_to song_path(@song), notice: 'Música criada com sucesso.'
    else
      render :new, status: :unprocessable_entity
    end
  end

  def update
    if @song.update(song_params)
      redirect_to song_path(@song), notice: 'Música atualizada com sucesso.'
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    if @song.setlists.any?
      redirect_to song_path(@song), alert: 'Não é possível excluir a música pois ela está associada a um ou mais setlists.'
      return
    end

    @song.destroy!
    redirect_to songs_path, notice: 'Música excluída com sucesso.'
  end

  def generate_pdf
    font_size = params[:font_size]&.to_i || 16
    pdf = Songs::GeneratePdfService.call(@song, font_size)

    send_data pdf,
              filename: "#{@song.title}.pdf",
              type: 'application/pdf',
              disposition: 'inline'
  end

  def transpose
    to_key = params[:transpose_key]
    @song.transpose_key = @song.original_key == to_key ? nil : to_key

    if @song.save
      redirect_to song_path(@song), notice: 'Tom atualizado com sucesso.'
    else
      redirect_to song_path(@song), alert: @song.errors.full_messages.to_sentence
    end
  end

  private

  def authorize_edit_action!
    PermissionService.authorize!(current_library, current_user, :edit)
  rescue PermissionService::PermissionError
    redirect_to songs_path, alert: 'Você não tem permissão para editar músicas nesta biblioteca.'
  end

  def set_song
    @song = Song.where(library_id: current_library.id, id: params[:id]).first
    @song ||= Song.joins(setlists: :setlist_users).where(setlist_users: { user_id: current_user.id }, id: params[:id]).first

    return if @song.present?

    redirect_to songs_path, alert: 'Você não tem acesso a esta música.' and return
  end

  def authorize_song_owner!
    return if @song.blank?
    return if @song.library_id == current_library.id

    redirect_to song_path(@song), alert: 'Apenas músicas da sua biblioteca podem ser editadas.' and return
  end

  def song_params
    params.require(:song).permit(
      :title, :artist, :genre, :original_key, :bpm, :attachment, :convert_pdf, :content, :capo,
      media_references_attributes: [:id, :media_type, :url, :attachment, :description, :_destroy]
    )
  end
end
