module SongsHelper
  def format_song_content(content)
    # return content
    return '' if content.blank?

    # Escapa o HTML
    content = ERB::Util.html_escape(content)

    # Processa o conteúdo linha por linha
    formatted_lines = content.split("\n").map do |line|
      chord_pattern = /[A-G][#b]?(?:m|maj|dim|aug|sus|add|M|min|°|\+)?(?:2|4|5|6|7|9|11|13)?(?:\([0-9]+(?:,\s*[0-9]+)*\))?(?:\/[A-G][#b]?)?/
      repeat_pattern = /\s*\[\d+x\]\s*/ # Padrão para [2x], [3x], etc.
      line.gsub!("\r", "")
      line.gsub!("\n", "")
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
    formatted_lines.join("\n").html_safe
  end
end
