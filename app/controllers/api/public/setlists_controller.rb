class Api::Public::SetlistsController < ApplicationController
  skip_before_action :authenticate_user!, only: [:show, :pdf]

  def pdf
    @setlist = Setlist.joins(:public_setlist).where(public_setlist: { uuid: params[:public_token] }).first
    if @setlist.nil?
      render plain: "Setlist not found", status: :not_found
      return
    end
    
    pdf = Setlists::MergePdfService.call(@setlist)
    
    send_data pdf,
            filename: "#{@setlist.title}.pdf",
            type: "application/pdf",
            disposition: "inline"
  end

  def show
    @setlist = Setlist.joins(:public_setlist).where(public_setlist: { uuid: params[:public_token] }).first
    
    if @setlist.nil?
      render json: { error: "Setlist not found" }, status: :not_found
      return
    end

    render json: {
      id: @setlist.id,
      title: @setlist.title,
      songs_count: @setlist.songs.count,
      public_token: @setlist.public_setlist.uuid,
      songs: @setlist.songs.order(:position).map do |song|
        {
          id: song.id,
          title: song.title,
          artist: song.artist,
          content: Songs::SongFormatterService.call(song),
          capo: song.capo,
          bpm: song.bpm,
          key: song.key
        }
      end
    }
  end
end
