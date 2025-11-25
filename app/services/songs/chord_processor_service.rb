module Songs
  class ChordProcessorService < ApplicationService
    def initialize(song)
      @song = song
    end

    def call
      content = @song.transpose_key.present? ? transpose : @song.content
      formatter(content)
    end

    private

    def formatter(content)
      Songs::SongFormatterService.call(content)
    end

    def transpose
      Songs::ChordTransposerService.call(@song)
    end
  end
end