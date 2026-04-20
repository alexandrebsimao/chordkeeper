module Songs
  class ChordProcessorService < ApplicationService
    def initialize(song, font_size: nil)
      @song = song
      @font_size = font_size
    end

    def call
      # Se lyrics (JSON) estiver disponível, usa ele. Senão, usa content (texto)
      lyrics_to_process = @song.transpose_key.present? ? transpose_lyrics : (@song.lyrics || @song.content)
      formatter(lyrics_to_process)
    end

    private

    def formatter(content)
      Songs::SongFormatterService.call(content, font_size: @font_size)
    end

    def transpose_lyrics
      Songs::ChordTransposerService.call(@song)
    end
  end
end