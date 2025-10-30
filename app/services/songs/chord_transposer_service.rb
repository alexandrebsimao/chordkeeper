# chord_transposer.rb
# Lógica para transposição de acordes musicais em Ruby
#
# Este módulo fornece funcionalidades para transpor acordes de músicas
# para diferentes tonalidades, incluindo acordes compostos com inversões.
#
# Estratégia: Processa linha por linha. Se uma linha contém apenas acordes
# (padrão: começa com espaços opcionais, contém apenas notas, modificadores,
# barras e espaços), transpõe todos os acordes. Caso contrário, deixa a linha
# intacta para preservar a letra.
module Songs
  class ChordTransposerService < ApplicationService
    def initialize(song)
      @song = song
    end

    def call
      semitones = calculate_interval(@song.original_key, @song.key)
      return @song.content unless semitones != 0
      transposed_lines = @song.content.lines.map do |line|
        if chord_line?(line)
          transpose_chord_line(line, semitones)
        else
          line
        end
      end
      transposed_lines.join
    end

    private

    NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].freeze

    # Verifica se uma string é uma nota válida
    # @param [String] note A string a ser verificada
    # @return [Boolean] true se for uma nota válida
    def valid_note?(note)
      NOTES.include?(note)
    end

    # Normaliza uma nota, convertendo bemóis para sustenidos
    # Exemplo: Db -> C#, Eb -> D#, etc.
    # @param [String] note A nota a ser normalizada
    # @return [String] A nota normalizada
    def normalize_note(note)
      note.gsub('Db', 'C#')
          .gsub('Eb', 'D#')
          .gsub('Gb', 'F#')
          .gsub('Ab', 'G#')
          .gsub('Bb', 'A#')
          .gsub('B#', 'C')
          .gsub('E#', 'F')
    end

    # Transpõe uma nota base para um novo número de semitons
    # @param [String] base_note A nota base (ex: "E", "C#")
    # @param [Integer] semitones Número de semitons para transpor (positivo para subir, negativo para descer)
    # @return [String] A nota transposta
    def transpose_base_note(base_note, semitones)
      normalized = normalize_note(base_note)

      unless valid_note?(normalized)
        return base_note # Retorna o original se não for uma nota válida
      end

      current_index = NOTES.index(normalized)
      
      # O módulo em Ruby para números negativos pode retornar um resultado negativo,
      # então adicionamos um múltiplo de 12 para garantir um índice positivo antes do módulo.
      new_index = (current_index + semitones) % 12
      new_index += 12 if new_index < 0
      
      NOTES[new_index]
    end

    # Verifica se uma linha contém apenas acordes (e espaços)
    # @param [String] line A linha a ser verificada
    # @return [Boolean] true se for uma linha de acordes
    def chord_line?(line)
      trimmed = line.strip

      # Linhas vazias não são linhas de acordes
      return false if trimmed.empty?

      # Remove rótulos entre colchetes no início
      content = trimmed.sub(/^\[.*?\]\s*/, '')

      # Se ficou vazio após remover rótulos, não é uma linha de acordes
      return false if content.empty?

      # Conta letras minúsculas - se houver muitas, é provavelmente letra
      lowercase_count = content.scan(/[a-z]/).count
      total_chars = content.length

      # Se mais de 30% são letras minúsculas, é provavelmente letra
      return false if lowercase_count.to_f / total_chars > 0.3

      # Verifica se a linha contém pelo menos um padrão de acorde válido
      # Padrão: [A-G][#b]? seguido por números, letras maiúsculas, parênteses, ou /
      # A regex do TS: /[A-G][#b]?(?:[0-9()\-#b/]|[A-Z](?=[0-9()\-#b/\s]|$))+/
      # Traduzida para Ruby:
      chord_pattern = /[A-G][#b]?(?:[0-9()\-#b\/]|[A-Z](?=[0-9()\-#b\/\s]|$))+/

      # Verifica se toda a linha corresponde ao padrão de acordes e espaços
      # A lógica do TS apenas testava se *existia* um acorde, mas a descrição
      # diz que a linha *contém apenas acordes*. A heurística de letras minúsculas
      # já ajuda, mas vamos manter a lógica de teste do TS.
      !!(content =~ chord_pattern)
    end

    # Transpõe os acordes em uma linha que contém apenas acordes
    # @param [String] line A linha contendo acordes
    # @param [Integer] semitones Número de semitons para transpor
    # @return [String] A linha com acordes transpostos
    def transpose_chord_line(line, semitones)
      # Regex para capturar acordes em uma linha de acordes
      # Captura: nota base + modificadores + inversão opcional
      # TS: /([A-G][#b]?)([0-9()\-#b]*)(?:\/([A-G][#b]?))?/g
      chord_regex = /([A-G][#b]?)([0-9()\-#b]*)(?:\/([A-G][#b]?))?/

      line.gsub(chord_regex) do |match|
        base_note = $1
        modifiers = $2
        bass_note = $3 # Opcional

        # Só transpõe se o match for realmente um acorde (começa com nota válida)
        if base_note.nil?
          match
        else
          transposed_base = transpose_base_note(base_note, semitones)
          result = transposed_base + modifiers

          if bass_note
            transposed_bass = transpose_base_note(bass_note, semitones)
            result += '/' + transposed_bass
          end

          result
        end
      end
    end

    # Transpõe o texto completo de uma música com cifras
    # Processa linha por linha, identificando linhas de acordes e transposição-as
    # @param [String] text O texto da música com cifras
    # @param [Integer] semitones Número de semitons para transpor
    # @return [String] O texto com as cifras transpostas
    def transpose_chords(text, semitones)
      text.split("\n").map do |line|
        # Se a linha é uma linha de acordes, transpõe os acordes
        if chord_line?(line)
          transpose_chord_line(line, semitones)
        else
          # Caso contrário, deixa a linha intacta
          line
        end
      end.join("\n")
    end

    # Retorna a lista de notas disponíveis
    # @return [Array<String>] A lista de notas
    def available_notes
      NOTES
    end

    # Calcula o intervalo em semitons entre duas notas
    # @param [String] from_note Nota de origem
    # @param [String] to_note Nota de destino
    # @return [Integer] Número de semitons (positivo para subir, negativo para descer)
    def calculate_interval(from_note, to_note)
      normalized_from = normalize_note(from_note)
      normalized_to = normalize_note(to_note)

      unless valid_note?(normalized_from) && valid_note?(normalized_to)
        return 0
      end

      from_index = NOTES.index(normalized_from)
      to_index = NOTES.index(normalized_to)

      interval = to_index - from_index

      # Ajusta para o intervalo mais curto
      if interval > 6
        interval -= 12
      elsif interval < -6
        interval += 12
      end

      interval
    end
  end
end