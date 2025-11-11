module Setlists
  class MergePdfService < ApplicationService
    def initialize(setlist, font_size = 16)
      @setlist = setlist
      @font_size = font_size
    end

    def call
      files = []
      @setlist.songs.order(:position).each do |song|
        if song.attachment.attached? && !song.convert_pdf
          files << song.attachment.download
        else
          pdfkit = Songs::GeneratePdfService.call(song, @font_size)
          files << pdfkit
        end
      end
      pdf = PdfProvider.merge(files)
      pdf
    end
  end
end