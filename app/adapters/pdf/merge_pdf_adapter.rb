module Pdf
  class MergePdfAdapter
    def initialize(pdf_files)
      @pdf_files = pdf_files
    end

    def merge
      combined_pdf = CombinePDF.new

      @pdf_files.each do |pdf_file|
        combined_pdf << CombinePDF.parse(pdf_file)
      end

      combined_pdf.to_pdf
    end
  end
end