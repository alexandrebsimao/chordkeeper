module Songs
  class GeneratePdfService < ApplicationService
    def initialize(song)
      @song = song
    end

    def call
      html_content = render_template('songs/pdf', layout: 'pdf', locals: { song: @song })
      pdfkit = PdfProvider.generate_from_html(html_content)
      pdfkit
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