module Songs
  class GeneratePdfService < ApplicationService
    def initialize(song, font_size = 16)
      @song = song
      @font_size = font_size
    end

    def call
      # Verifica se existe cache no banco de dados
      cached_pdf = @song.song_pdf_caches.find_by(font_size: @font_size)
      return cached_pdf.pdf_binary if cached_pdf
      
      # Gera PDF se não existir cache
      html_content = render_template('songs/pdf', layout: 'pdf', locals: { song: @song, font_size: @font_size })
      pdf_binary = PdfProvider.generate_from_html(html_content)

      pdf_binary
    end

    private

    def render_template(template_path, layout:, locals:)
      ApplicationController.render(
        template: template_path,
        layout: layout,
        locals: locals
      )
    end
  end
end