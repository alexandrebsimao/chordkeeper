module Songs
  class SongFormatterService < ApplicationService
    def initialize(content, font_size: nil)
      @content = content
      @font_size = font_size || 14  # Tamanho padrão
    end

    def call
      return '' if @content.blank?
      
      # Se o conteúdo é um array (formato JSON de lyrics)
      if @content.is_a?(Array)
        format_lyrics_json(@content)
      else
        # Se é uma string (texto plano), processa linha por linha
        format_text_content(@content)
      end
    end

    private

    def format_lyrics_json(lyrics_array)
      return '' if lyrics_array.blank?
      
      # Primeiro converte para ChordPro texto
      chordpro_text = lyrics_array.map do |line|
        format_lyrics_line_to_chordpro(line)
      end.join("\n")
      
      # Depois parseia e formata como HTML
      parse_and_format_chordpro(chordpro_text)
    end

    def format_lyrics_line_to_chordpro(parsed_line)
      return "" if parsed_line.blank?
      
      parsed_line.map do |segment|
        # Suporta tanto símbolos quanto strings como chaves
        text = segment[:text] || segment["text"] || ""
        chord = segment[:chord] || segment["chord"]
        
        # Remove \r do texto
        text = text.gsub("\r", "")
        
        if chord.present?
          "[#{chord}]#{text}"
        else
          text
        end
      end.join("")
    end

    def parse_and_format_chordpro(text)
      lines = text.split("\n")
      html_parts = []
      current_section = nil
      current_section_lines = []
      
      lines.each do |line|
        # Diretivas de seção
        if line =~ /^\{start_of_(\w+)(?::\s*(.+))?\}$/
          # Salva seção anterior se existir
          if current_section
            html_parts << render_section(current_section[:type], current_section[:label], current_section_lines)
            current_section_lines = []
          end
          
          section_type = $1
          section_label = $2 || section_type
          current_section = { type: section_type, label: section_label }
          next
        end
        
        if line =~ /^\{end_of_\w+\}$/
          if current_section
            html_parts << render_section(current_section[:type], current_section[:label], current_section_lines)
            current_section = nil
            current_section_lines = []
          end
          next
        end
        
        # Comentários
        if line =~ /^\{comment:\s*(.+)\}$/
          comment_text = $1
          html_parts << render_section('comment', comment_text, [])
          next
        end
        
        # Linhas normais
        if current_section
          current_section_lines << line
        else
          # Linha sem seção específica
          html_parts << format_chordpro_line(line)
        end
      end
      
      # Salva última seção se existir
      if current_section
        html_parts << render_section(current_section[:type], current_section[:label], current_section_lines)
      end
      
      html_parts.join("\n").html_safe
    end

    def render_section(type, label, lines)
      section_html = []
      
      # Label da seção
      unless label.blank?
        color_map = {
          'verse' => { bg: 'rgba(99,102,241,0.15)', border: '#6366f1', text: '#818cf8' },
          'chorus' => { bg: 'rgba(236,72,153,0.15)', border: '#ec4899', text: '#f472b6' },
          'bridge' => { bg: 'rgba(20,184,166,0.15)', border: '#14b8a6', text: '#2dd4bf' },
          'comment' => { bg: 'rgba(251,191,36,0.15)', border: '#fbbf24', text: '#fcd34d' }
        }
        
        colors = color_map[type] || color_map['verse']
        
        section_html << %{
          <div style="margin: 12px 0 6px 0;">
            <span class="line" style="display: inline-block; padding: 3px 12px; border-radius: 20px; 
                         background: #{colors[:bg]}; border: 1px solid #{colors[:border]};
                         font-size: 11px; font-weight: 600; 
                         letter-spacing: 0.08em; text-transform: uppercase; color: #{colors[:text]};">
              #{ERB::Util.html_escape(label)}
            </span>
          </div>
        }
      end
      
      # Linhas da seção
      lines.each do |line|
        section_html << format_chordpro_line(line)
      end
      
      section_html.join("\n")
    end

    def format_chordpro_line(line)
      return "<div style='margin-bottom: 0px;'></div>" if line.strip.empty?
      
      # Parse acordes [C] texto
      segments = []
      regex = /\[([^\]]+)\]([^\[]*)/
      last_index = 0
      
      line.scan(regex) do |match|
        chord = match[0]
        text = match[1]
        match_start = Regexp.last_match.begin(0)
        
        # Texto antes do acorde
        if match_start > last_index
          segments << { chord: nil, text: line[last_index...match_start] }
        end
        
        segments << { chord: chord, text: text }
        last_index = Regexp.last_match.end(0)
      end
      
      # Texto final
      if last_index < line.length
        segments << { chord: nil, text: line[last_index..-1] }
      end
      
      # Se não tem acordes, retorna texto simples
      if segments.empty? || segments.all? { |s| s[:chord].nil? }
        return "<div style='font-family: DejaVu Sans Mono, monospace; font-size: #{@font_size}px; color: #1e293b; line-height: 1.4; margin-bottom: 4px;'>#{ERB::Util.html_escape(line)}</div>"
      end
      
      # Monta duas linhas: acordes e letra
      chords_line = ""
      lyrics_line = ""
      
      segments.each do |seg|
        if seg[:chord]
          # Tem acorde
          chord_text = seg[:chord]
          lyric_text = seg[:text]
          
          # Adiciona o acorde sem padding extra
          chords_line += chord_text
          
          # Define espaçamento mínimo entre acordes (para cifras isoladas)
          min_spacing = 2
          
          # Calcula quantos espaços adicionar após o acorde
          # Se a letra é maior que o acorde, completa com espaços
          if lyric_text.length > chord_text.length
            chords_line += " " * (lyric_text.length - chord_text.length)
          elsif lyric_text.empty? || lyric_text.strip.empty?
            # Se não há letra, adiciona espaçamento mínimo entre acordes
            chords_line += " " * min_spacing
          end
          
          # Adiciona a letra
          lyrics_line += lyric_text
          
          # Se o acorde é maior que a letra, adiciona espaços na letra
          if chord_text.length > lyric_text.length
            lyrics_line += " " * (chord_text.length - lyric_text.length)
          elsif lyric_text.empty? || lyric_text.strip.empty?
            # Se não há letra, adiciona espaçamento mínimo
            lyrics_line += " " * min_spacing
          end
        else
          # Sem acorde, apenas texto
          text_length = seg[:text].length
          # Adiciona espaços vazios na linha de acordes
          chords_line += " " * text_length
          # Adiciona o texto na linha de letras
          lyrics_line += seg[:text]
        end
      end
      
      html = "<div style='margin-bottom: 10px;'>"
      
      # Linha de acordes (em rosa, monospace)
      if chords_line.strip.present?
        html += "<div class='line' style='font-family: DejaVu Sans Mono, monospace; font-size: #{@font_size}px; font-weight: bold; color: #ec4899; line-height: 1.4; white-space: pre; margin-bottom: 0;'>#{ERB::Util.html_escape(chords_line.rstrip)}</div>"
      end
      
      # Linha de letras (em monospace)
      if lyrics_line.strip.present?
        html += "<div class='line' style='font-family: DejaVu Sans Mono, monospace; font-size: #{@font_size}px; color: #1e293b; line-height: 1.4; white-space: pre; margin-top: 0;'>#{ERB::Util.html_escape(lyrics_line.rstrip)}</div>"
      end
      
      html += "</div>"
      html
    end

    def format_text_content(content)
      return '' if content.blank?

      # Se o conteúdo contém diretivas ChordPro, usa o parser
      if content.match?(/\{(start_of_|end_of_|comment:)/)
        parse_and_format_chordpro(content)
      else
        # Processa como texto simples com acordes
        format_simple_text(content)
      end
    end

    def format_simple_text(content)
      # Escapa o HTML
      escaped_content = ERB::Util.html_escape(content)

      # Padrão de acorde - captura acordes completos incluindo inversões
      chord_pattern = /(?<![a-zA-Z0-9])([A-G][#b]?(?:M|m|maj|min|dim|aug|sus|add|°|\+)?(?:[0-9]+)?(?:\([^)]*\))?(?:[#b0-9\-]*)?(?:\/[A-G][#b]?)?)(?![a-z])/

      # Processa o conteúdo linha por linha
      formatted_lines = escaped_content.split("\n").map do |line|
        line.gsub!("\r", "")

        # Verifica se é uma linha de notação (entre chaves)
        if line.match?(/^\s*\{([^}]+)\}\s*$/)
          "<span class=\"notation\">#{line}</span>"
        elsif line.include?('|-') || line.include?('-|')
          line
        else
          # Envolve cada acorde com <span class="chord">...</span>
          format_line_with_chords(line, chord_pattern)
        end
      end

      # Junta as linhas novamente
      formatted_lines.join("\n").html_safe
    end

    def format_line_with_chords(line, chord_pattern)
      # Evita palavras comuns em português que não são acordes
      line.gsub(chord_pattern) do |match|
        word = match.strip
        
        non_chords_lowercase = %w[
          as o os de da do das dos em na no nas nos
          que com por para se te me tu eu ele ela
          ai ei ou ah oh bem mal si la sol cor som tom
          di ti
        ]
        
        non_chords_any_case = %w[És]
        
        match_index = line.index(match)
        
        next_char_index = match_index + match.length
        next_char = next_char_index < line.length ? line[next_char_index] : ' '
        has_lowercase_after = next_char =~ /[a-zà-ú]/
        
        prev_char_index = match_index - 1
        prev_char = prev_char_index >= 0 ? line[prev_char_index] : ' '
        has_lowercase_before = prev_char =~ /[a-zà-ú]/
        
        has_lyrics_in_line = line.match?(/[a-zà-ú]{2,}/)
        
        line_trimmed = line.lstrip
        starts_line = line_trimmed.start_with?(word)
        
        after_space = line[match_index + match.length..-1].to_s.lstrip
        starts_with_common_word = after_space.match?(/^(um|uma|uns|umas|o|a|os|as|eu|tu|ele|ela|nós|vós|eles|elas|meu|minha|teu|tua|seu|sua)\b/i)
        
        if (word == 'E' || word == 'A') && starts_line && (has_lyrics_in_line || starts_with_common_word)
          match
        elsif has_lowercase_before || has_lowercase_after
          match
        elsif non_chords_any_case.any? { |nc| nc.casecmp?(word) }
          match
        elsif word.downcase == word && non_chords_lowercase.include?(word)
          match
        else
          "<span class=\"chord\">#{match}</span>"
        end
      end
    end
  end
end