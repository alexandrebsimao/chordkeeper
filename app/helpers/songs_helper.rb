module SongsHelper
  def format_song_content(content)
    return '' if content.blank?

    # Escapa o HTML
    content = ERB::Util.html_escape(content)

    # Padrão de acorde - captura acordes completos incluindo inversões com # e b
    # Aceita: A, Am, A7, A#m, Abm, Asus4, Amaj7, A/G, D9, E11/G#, etc.
    # Nota: Não usa \b no final para permitir capturar # e b após a barra
    chord_pattern = /(?<![a-zA-Z0-9])([A-G][#b]?(?:m|maj|dim|aug|sus|add|M|min|°|\+)?(?:2|4|5|6|7|9|11|13)?(?:\/[A-G][#b]?)?)(?![a-z])/

    # Processa o conteúdo linha por linha
    formatted_lines = content.split("\n").map do |line|
      line.gsub!("\r", "")

      # Verifica se é uma linha de notação (entre chaves)
      if line.match?(/^\s*\{([^}]+)\}\s*$/)
        "<span class=\"notation\">#{line}</span>"
      else
        # Envolve cada acorde com <span class="chord">...</span>
        # Evita palavras comuns em português que não são acordes
        line.gsub(chord_pattern) do |match|
          word = match.strip
          
          # Lista de palavras comuns que NÃO são acordes
          non_chords = %w[
            as o os de da do das dos em na no nas nos
            que com por para se te me tu és eu ele ela
            ai ei ou ah oh bem mal si la sol cor som tom
            Di Ti
          ]
          
          # Pega a posição do match na linha original (antes de qualquer substituição)
          match_index = line.index(match)
          
          # Verifica o contexto: se tem letra minúscula logo após (sem espaço),
          # provavelmente não é um acorde (ex: "És", "Ao", "Em")
          next_char_index = match_index + match.length
          next_char = next_char_index < line.length ? line[next_char_index] : ' '
          has_lowercase_after = next_char =~ /[a-zà-ú]/
          
          # Verifica se tem letra minúscula logo antes (sem espaço)
          prev_char_index = match_index - 1
          prev_char = prev_char_index >= 0 ? line[prev_char_index] : ' '
          has_lowercase_before = prev_char =~ /[a-zà-ú]/
          
          # Verifica se tem letras minúsculas na mesma linha
          # Se a linha tem texto de letra de música (várias palavras em minúscula),
          # então E ou A isolados no início provavelmente são conjunções
          has_lyrics_in_line = line.match?(/[a-zà-ú]{2,}/)
          
          # Verifica se a linha começa com este match (ignorando espaços)
          line_trimmed = line.lstrip
          starts_line = line_trimmed.start_with?(word)
          
          # Verifica se após o espaço tem uma palavra comum (artigos, pronomes, etc)
          # que indica que é uma frase, não uma sequência de acordes
          after_space = line[match_index + match.length..-1].to_s.lstrip
          starts_with_common_word = after_space.match?(/^(um|uma|uns|umas|o|a|os|as|eu|tu|ele|ela|nós|vós|eles|elas|meu|minha|teu|tua|seu|sua)\b/i)
          
          # REGRA PRINCIPAL: Se E ou A está no início da linha E (tem texto de letra OU palavra comum após), não é acorde
          if (word == 'E' || word == 'A') && starts_line && (has_lyrics_in_line || starts_with_common_word)
            match
          # Se tem letra minúscula antes ou depois (colada), não é acorde
          elsif has_lowercase_before || has_lowercase_after
            match
          # Se está na lista de não-acordes, não formata
          elsif non_chords.any? { |nc| nc.casecmp?(word) }
            match
          else
            # É um acorde válido, formata
            "<span class=\"chord\">#{match}</span>"
          end
        end
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
