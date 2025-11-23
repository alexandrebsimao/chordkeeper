module Songs
  class GeneratePdfService < ApplicationService
    def initialize(song, font_size = 16)
      @song = song
      @font_size = font_size
    end

    def call
      Rails.cache.fetch(["song_pdf", @song.id, @font_size].join("-"), expires_in: 1.hour) do
        html_content = render_template('songs/pdf', layout: 'pdf', locals: { song: @song, font_size: @font_size })
        pdfkit = PdfProvider.generate_from_html(html_content)
        pdfkit
      end
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