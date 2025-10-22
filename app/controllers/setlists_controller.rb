class SetlistsController < ApplicationController
  before_action :set_setlist, only: %i[ show edit update destroy manage_songs print save_songs add_song remove_song ]

  # GET /setlists or /setlists.json
  def index
    @setlists = Setlist.all
  end

  # GET /setlists/1 or /setlists/1.json
  def show
  end

  # GET /setlists/1/manage_songs
  def manage_songs
    @library = @setlist.library
  end

  # GET /setlists/1/print
  def print
    @song = Song.find(params[:id])

    html = <<~HTML
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          @font-face {
            font-family: 'DejaVu Sans Mono';
            src: url('https://cdn.jsdelivr.net/npm/@fontsource/dejavu-sans-mono@4.5.4/files/dejavu-sans-mono-latin-400-normal.woff2') format('woff2');
          }
          
          body {
            margin: 30px;
            background: white;
            font-family: 'DejaVu Sans Mono', monospace;
          }

          .header {
            margin-bottom: 30px;
          }

          .title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
            font-family: Arial, sans-serif;
          }

          .subtitle {
            font-size: 16px;
            color: #666;
            margin-bottom: 5px;
            font-family: Arial, sans-serif;
          }

          .metadata {
            font-size: 14px;
            color: #888;
            margin-bottom: 20px;
            font-family: Arial, sans-serif;
          }

          pre {
            font-family: 'DejaVu Sans Mono', monospace;
            font-size: 14px;
            line-height: 1.4;
            letter-spacing: 0;
            color: #000;
            white-space: pre;
            word-break: keep-all;
            overflow-wrap: normal;
            tab-size: 8;
            padding: 20px;
            background-color: #fff;
            border: 1px solid #e5e5e5;
            border-radius: 4px;
          }

          .chord-line {
            color: #2563eb;
            font-weight: bold;
          }

          .tab-line {
            color: #000;
            font-size: 13px;
            line-height: 1.2;
          }

          @media print {
            body {
              margin: 0;
              padding: 20px;
            }

            pre {
              border: none;
              padding: 0;
              background: none;
            }

            .page-break {
              page-break-after: always;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">#{ERB::Util.html_escape(@song.title)}</div>
          <div class="subtitle">#{ERB::Util.html_escape(@song.artist)}</div>
          <div class="metadata">
            #{@song.key.present? ? "Tom: #{ERB::Util.html_escape(@song.key)}" : ""}
            #{@song.bpm.present? ? "&nbsp;&nbsp;|&nbsp;&nbsp;BPM: #{ERB::Util.html_escape(@song.bpm.to_s)}" : ""}
          </div>
        </div>

        <pre>#{@song.content}</pre>
      </body>
      </html>
    HTML

    # Configurações do PDFKit
    pdf = PDFKit.new(html, {
      page_size: 'A4',
      margin_top: '10mm',
      margin_right: '10mm',
      margin_bottom: '10mm',
      margin_left: '10mm',
      encoding: 'UTF-8',
      print_media_type: true
    })

    pdfkit = PDFKit.new(html)


    pdf = CombinePDF.new
    pdf << CombinePDF.parse(pdfkit.to_pdf)
    song = Song.last
    pdf << CombinePDF.parse(song.attachment.download)
    # pdf << CombinePDF.load('path/load/url')
    
    send_data pdf.to_pdf,
            filename: "documento_final.pdf",
            type: "application/pdf",
            disposition: "inline"
  end

  # POST /setlists/1/save_songs
  def save_songs
    song_order = params[:song_order]
    if song_order
      @setlist.setlist_songs.destroy_all
      song_order.each_with_index do |song_id, index|
        @setlist.setlist_songs.create(song_id: song_id, position: index + 1)
      end
      head :ok
    else
      head :unprocessable_entity
    end
  end

  # POST /setlists/1/add_song
  def add_song
    begin
      song = Song.find(params[:song_id])
      position = @setlist.setlist_songs.count + 1
      @setlist.setlist_songs.create!(song: song, position: position)
      render json: { song_id: song.id, title: song.title }, status: :created
    rescue ActiveRecord::RecordInvalid, ActiveRecord::RecordNotFound => e
      Rails.logger.error("Erro ao adicionar música: #{e.message}")
      head :unprocessable_entity
    end
  end

  # DELETE /setlists/1/remove_song
  def remove_song
    begin
      song = Song.find(params[:song_id])
      @setlist.songs.delete(song)
      head :ok
    rescue ActiveRecord::RecordNotFound => e
      Rails.logger.error("Erro ao remover música: #{e.message}")
      head :not_found
    end
  end

  # GET /setlists/new
  def new
    @setlist = Setlist.new
  end

  # GET /setlists/1/edit
  def edit
  end

  # POST /setlists or /setlists.json
  def create
    @setlist = Setlist.new(setlist_params)

    respond_to do |format|
      if @setlist.save
        format.html { redirect_to @setlist, notice: "Setlist was successfully created." }
        format.json { render :show, status: :created, location: @setlist }
      else
        format.html { render :new, status: :unprocessable_entity }
        format.json { render json: @setlist.errors, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /setlists/1 or /setlists/1.json
  def update
    respond_to do |format|
      if @setlist.update(setlist_params)
        format.html { redirect_to @setlist, notice: "Setlist was successfully updated." }
        format.json { render :show, status: :ok, location: @setlist }
      else
        format.html { render :edit, status: :unprocessable_entity }
        format.json { render json: @setlist.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /setlists/1 or /setlists/1.json
  def destroy
    @setlist.destroy!

    respond_to do |format|
      format.html { redirect_to setlists_path, status: :see_other, notice: "Setlist was successfully destroyed." }
      format.json { head :no_content }
    end
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_setlist
      @setlist = Setlist.find(params.expect(:id))
    end

    # Only allow a list of trusted parameters through.
    def setlist_params
      params.expect(setlist: [ :name, :description, :library_id ])
    end
end
