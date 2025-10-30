module Pdf
  class PdfkitAdapter
    def initialize(html_content)
      @html_content = html_content
    end

    def generate
      PDFKit.new(
        @html_content,
        page_size: 'A4',
        margin_top: '10mm',
        margin_right: '10mm',
        margin_bottom: '10mm',
        margin_left: '10mm',
        encoding: 'UTF-8',
        print_media_type: true
      )
    end

    def to_pdf
      generate.to_pdf
    end
  end
end
