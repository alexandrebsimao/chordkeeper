module Setlists
  class MergePdf < ApplicationService
    def initialize(setlist)
      @setlist = setlist
    end

    def call
      pdf = CombinePDF.new

      @setlist.songs.order(:position).each do |song|
        if song.attachment.attached? && !song.convert_pdf
          pdf << CombinePDF.parse(song.attachment.download)
        else
          pdfkit = Songs::GeneratePdf.call(song)
          pdf << CombinePDF.parse(pdfkit.to_pdf)
        end
      end

      pdf
    end
  end
end