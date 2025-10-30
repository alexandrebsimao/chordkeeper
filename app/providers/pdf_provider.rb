class PdfProvider
  class << self
    def generate_from_html(html_content)
      pdfkit = pdfkit_adapter.new(html_content)
      pdfkit.to_pdf
    end

    def merge(pdf_files)
      merger = merge_adapter.new(pdf_files)
      merger.merge
    end

    private

    def pdfkit_adapter
      Pdf::PdfkitAdapter
    end

    def merge_adapter
      Pdf::MergePdfAdapter
    end
  end
end