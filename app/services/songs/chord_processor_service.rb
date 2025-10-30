module Songs
  class ChordProcessorService < ApplicationService
    def initialize(song)
      @song = song
    end

    def call
      @song.content = transpose if @song.transpose_key.present?
      @song.content = formatter
      @song.content
    end

    private

    def formatter
      Songs::SongFormatterService.call(@song)
    end

    def transpose
      Songs::ChordTransposerService.call(@song)
    end
  end
end