module Songs
  class CachedService < ApplicationService
    def initialize(song)
      @song = song
    end
  
    def call
      # Remove caches antigos
      @song.song_pdf_caches.delete_all
      
      # Gera e salva PDFs para cada tamanho de fonte individualmente
      (12..24).each do |font_size|
        pdf_binary = GeneratePdfService.call(@song, font_size)
        
        cache = SongPdfCache.new(
          song_id: @song.id,
          font_size: font_size
        )
        cache.pdf_binary = pdf_binary
        cache.save!
      end
    end
  end 
end