module Songs
  class GeneratePdf < ApplicationService
    def initialize(song)
      @song = song
    end

    def call
      pdfkit = PDFKit.new(
        ApplicationController.render(
          template: 'songs/pdf',
          layout: 'pdf',
          locals: { song: @song }
        ),
        page_size: 'A4',
        margin_top: '10mm',
        margin_right: '10mm',
        margin_bottom: '10mm',
        margin_left: '10mm',
        encoding: 'UTF-8',
        print_media_type: true
      )

      pdfkit
    end
  end
end