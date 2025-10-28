class PublicSetlistController < ApplicationController
  skip_before_action :authenticate_user!, only: [:show]

  def show
    @setlist = Setlist.joins(:public_setlist).where(public_setlist: { uuid: params[:public_token] }).first
    if @setlist.nil?
      render plain: "Setlist not found", status: :not_found
      return
    end
    # render layout: 'public'
    pdf = CombinePDF.new

    @setlist.songs.order(:position).each do |song|
      if song.attachment.attached?
        pdf << CombinePDF.parse(song.attachment.download)
      else
        pdfkit = Songs::GeneratePdf.call(song)
        pdf << CombinePDF.parse(pdfkit.to_pdf)
      end
    end
    
    send_data pdf.to_pdf,
            filename: "#{@setlist.name}.pdf",
            type: "application/pdf",
            disposition: "inline"
  end
end
