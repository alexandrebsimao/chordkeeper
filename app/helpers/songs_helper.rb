module SongsHelper
  def format_song_content(content)
    return '' if content.blank?

    # Escapa o HTML
    content = ERB::Util.html_escape(content)

    # Padrão de acorde original
    # O padrão é mantido como está, pois é bem definido.
    chord_pattern = /[A-G][#b]?(?:m|maj|dim|aug|sus|add|M|min|°|\+)?(?:2|4|5|6|7|9|11|13)?(?:\([0-9]+(?:,\s*[0-9]+)*\))?(?:\/[A-G][#b]?)?/
    repeat_pattern = /\s*\[\d+x\]\s*/ # Padrão para [2x], [3x], etc.

    # Processa o conteúdo linha por linha
    formatted_lines = content.split("\n").map do |line|
      line.gsub!("\r", "")

      # 1. Verifica se é uma linha de acordes (apenas acordes e espaços)
      # Esta verificação é feita na linha original (sem substituições) para manter a lógica de chord-line.
      is_chord_line = line.strip.gsub(repeat_pattern, '').match?(/^#{chord_pattern}(?:\s+#{chord_pattern})*\s*$/)

      # 2. Envolve cada acorde com <span class="chord">...</span> em todas as linhas
      # Usamos \b (word boundary) para garantir que o acorde não seja parte de uma palavra (e.g., 'G' em 'sing').
      line_with_individual_chords = line.gsub(/\b(#{chord_pattern})\b/) do |match|
        "<span class=\"chord-line\">#{match}</span>"
      end
      
      if line.match?(/\{([^}]+)\}/)
        "<span class=\"notation\">#{line}</span>"
      elsif is_chord_line
        # 3. Se for uma linha de acordes, envolve o resultado com <span class="chord-line">...</span>
        # O resultado já contém os acordes individualmente formatados.
        "<span class=\"chord-line\">#{line_with_individual_chords}</span>"
      else
        # Linha mista ou de texto puro, apenas retorna a linha com os acordes envolvidos
        line_with_individual_chords
      end
    end

    # Junta as linhas novamente
    formatted_lines.join("\n").html_safe
  end


  def chord_link(song)
    if song.attachment.attached? && !song.convert_pdf
      song.attachment.presence
    else
      generate_pdf_song_path(song)
    end
  end
end
