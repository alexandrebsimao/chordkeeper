class SongsController < ApplicationController
  before_action :set_song, only: %i[ show edit update destroy ]

  # GET /songs or /songs.json
  def index
    @songs = Song.all
  end

  # GET /songs/1 or /songs/1.json
  def show
  end

  # GET /songs/new
  def new
    @song = Song.new
  end

  # GET /songs/1/edit
  def edit
  end

  # POST /songs or /songs.json
  def create
    @song = Song.new(song_params)

    respond_to do |format|
      if @song.save
        format.html { redirect_to @song, notice: "Música criada com sucesso." }
        format.json { render :show, status: :created, location: @song }
      else
        format.html { render :new, status: :unprocessable_entity }
        format.json { render json: @song.errors, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /songs/1 or /songs/1.json
  def update
    respond_to do |format|
      if @song.update(song_params)
        format.html { redirect_to @song, notice: "Música atualizada com sucesso." }
        format.json { render :show, status: :ok, location: @song }
      else
        format.html { render :edit, status: :unprocessable_entity }
        format.json { render json: @song.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /songs/1 or /songs/1.json
  def destroy
    @song.destroy!

    respond_to do |format|
      format.html { redirect_to songs_path, status: :see_other, notice: "Música excluída com sucesso." }
      format.json { head :no_content }
    end
  end

  def generate_pdf
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

        <pre>#{format_song_content(@song.content)}</pre>
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

    pdf = PDFKit.new(html)

    send_data pdf.to_pdf,
              filename: "#{@song.title}.pdf",
              type: "application/pdf",
              disposition: "inline" # ou "attachment" para download
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_song
      @song = Song.find(params.expect(:id))
    end

    # Only allow a list of trusted parameters through.
    def song_params
      params.require(:song).permit(:title, :artist, :album, :genre, :key, :bpm, :duration, 
                                 :content, :content_type, :attachment, :library_id)
    end

    def format_song_content(content)
      # return content
      return '' if content.blank?

      # Escapa o HTML
      content = ERB::Util.html_escape(content)

      # Processa o conteúdo linha por linha
      formatted_lines = content.split("\n").map do |line|
        chord_pattern = /[A-G][#b]?(?:m|maj|dim|aug|sus|add|M|min|°|\+)?(?:2|4|5|6|7|9|11|13)?(?:\([0-9]+(?:,\s*[0-9]+)*\))?(?:\/[A-G][#b]?)?/
        repeat_pattern = /\s*\[\d+x\]\s*/ # Padrão para [2x], [3x], etc.
        if line.strip.gsub(repeat_pattern, '').match?(/^#{chord_pattern}(?:\s+#{chord_pattern})*\s*$/)
          # Linha de acordes
          "<span class=\"chord-line\">#{line}</span>"
        # elsif line.match?(/^\|?[-\|][A-Za-z0-9\-|/\\]*[-\|]?\s*$/)
        #   # Linha de tablatura
        #   "<span class=\"tab-line\">#{line}</span>"
        else
          # Linha normal
          line
        end
      end

      # Junta as linhas novamente
      formatted_lines.join("\n")
    end
end
