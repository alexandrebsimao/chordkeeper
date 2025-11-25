module Songs
  class CachedService < ApplicationService
    def initialize(song)
      @song = song
    end
  
    def call
      (12..24).each do |font_size|
        Rails.cache.write(
          ["song_pdf", @song.id, font_size].join("-"),
          GeneratePdfService.call(@song, font_size),
          expires_in: 1.hour
        )
      end
    end
  end 
end