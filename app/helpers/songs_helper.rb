module SongsHelper
  def format_song_content(song)
    Songs::ChordProcessorService.call(song).html_safe
  end

  def format_song_content_for_pdf(song, font_size)
    Songs::ChordProcessorService.call(song, font_size: font_size).html_safe
  end

  def chord_link(song)
    if song.attachment.attached? && !song.convert_pdf
      song.attachment.presence
    else
      generate_pdf_song_path(song)
    end
  end
end
