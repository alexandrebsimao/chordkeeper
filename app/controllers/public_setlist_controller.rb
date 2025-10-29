class PublicSetlistController < ApplicationController
  skip_before_action :authenticate_user!, only: [:show]

  def show
    @setlist = Setlist.joins(:public_setlist).where(public_setlist: { uuid: params[:public_token] }).first
    if @setlist.nil?
      render plain: "Setlist not found", status: :not_found
      return
    end
    
    pdf = Setlists::MergePdf.call(@setlist)
    
    send_data pdf.to_pdf,
            filename: "#{@setlist.title}.pdf",
            type: "application/pdf",
            disposition: "inline"
  end
end
