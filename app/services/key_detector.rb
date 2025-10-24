# detect_key.rb
# Script em Ruby para identificar o tom de uma música a partir de uma lista de acordes.

class KeyDetector
  # Mapeamento de acordes comuns para cada tonalidade (Major e Minor)
  # A lista inclui os graus I, IV, V (dominantes) e os graus relativos (ii, iii, vi)
  # para dar peso aos acordes mais comuns em progressões.
  # Adicionado o acorde V maior para tonalidades menores (ex: E em Am)
  TONALIDADES = {
    'C' => ['C', 'Dm', 'Em', 'F', 'G', 'Am', 'Bdim'],
    'G' => ['G', 'Am', 'Bm', 'C', 'D', 'Em', 'F#dim'],
    'D' => ['D', 'Em', 'F#m', 'G', 'A', 'Bm', 'C#dim'],
    'A' => ['A', 'Bm', 'C#m', 'D', 'E', 'F#m', 'G#dim'],
    'E' => ['E', 'F#m', 'G#m', 'A', 'B', 'C#m', 'D#dim'],
    'B' => ['B', 'C#m', 'D#m', 'E', 'F#', 'G#m', 'A#dim'],
    'F#' => ['F#', 'G#m', 'A#m', 'B', 'C#', 'D#m', 'E#dim'],
    'C#' => ['C#', 'D#m', 'E#m', 'F#', 'G#', 'A#m', 'B#dim'],
    'F' => ['F', 'Gm', 'Am', 'Bb', 'C', 'Dm', 'Edim'],
    'Bb' => ['Bb', 'Cm', 'Dm', 'Eb', 'F', 'Gm', 'Adim'],
    'Eb' => ['Eb', 'Fm', 'Gm', 'Ab', 'Bb', 'Cm', 'Ddim'],
    'Ab' => ['Ab', 'Bbm', 'Cm', 'Db', 'Eb', 'Fm', 'Gdim'],
    'Db' => ['Db', 'Ebm', 'Fm', 'Gb', 'Ab', 'Bbm', 'Cdim'],
    'Gb' => ['Gb', 'Abm', 'Bbm', 'Cb', 'Db', 'Ebm', 'Fdim'],
    'Cb' => ['Cb', 'Dbm', 'Ebm', 'Fb', 'Gb', 'Abm', 'Bbdim'],

    # Tonalidades Menores (relativas)
    'Cm' => ['Cm', 'Ddim', 'Eb', 'Fm', 'Gm', 'Ab', 'Bb', 'G'], # V maior (G)
    'Gm' => ['Gm', 'Adim', 'Bb', 'Cm', 'Dm', 'Eb', 'F', 'D'], # V maior (D)
    'Dm' => ['Dm', 'Edim', 'F', 'Gm', 'Am', 'Bb', 'C', 'A'], # V maior (A)
    'Am' => ['Am', 'Bdim', 'C', 'Dm', 'Em', 'F', 'G', 'E'], # V maior (E)
    'Em' => ['Em', 'F#dim', 'G', 'Am', 'Bm', 'C', 'D', 'B'], # V maior (B)
    'Bm' => ['Bm', 'C#dim', 'D', 'Em', 'F#m', 'G', 'A', 'F#'], # V maior (F#)
    'F#m' => ['F#m', 'G#dim', 'A', 'Bm', 'C#m', 'D', 'E', 'C#'], # V maior (C#)
    'C#m' => ['C#m', 'D#dim', 'E', 'F#m', 'G#m', 'A', 'B', 'G#'], # V maior (G#)
    'G#m' => ['G#m', 'A#dim', 'B', 'C#m', 'D#m', 'E', 'F#', 'D#'], # V maior (D#)
    'D#m' => ['D#m', 'E#dim', 'F#', 'G#m', 'A#m', 'B', 'C#', 'A#'], # V maior (A#)
    'A#m' => ['A#m', 'B#dim', 'C#', 'D#m', 'E#m', 'F#', 'G#', 'E#'], # V maior (E#)
    'Fm' => ['Fm', 'Gdim', 'Ab', 'Bbm', 'Cm', 'Db', 'Eb', 'C'], # V maior (C)
    'Bbm' => ['Bbm', 'Cdim', 'Db', 'Ebm', 'Fm', 'Gb', 'Ab', 'F'], # V maior (F)
    'Ebm' => ['Ebm', 'Fdim', 'Gb', 'Abm', 'Bbm', 'Cb', 'Db', 'Bb'], # V maior (Bb)
    'Abm' => ['Abm', 'Bbdim', 'Cb', 'Dbm', 'Ebm', 'Fb', 'Gb', 'Eb'] # V maior (Eb
  }

  # Regex para extrair acordes. A regex foi ajustada para ser mais permissiva com o tipo de acorde.
  # Agora busca por acordes soltos ou entre parênteses.
  CHORD_REGEX = /([A-G][b#]?)(m|min|maj|M|dim|aug|sus|add|7|9|11|13|\d)*(\/[A-G][b#]?)?/

  # Mapeamento de tonalidades relativas para bônus de pontuação
  RELATIVAS = {
    'C' => 'Am', 'G' => 'Em', 'D' => 'Bm', 'A' => 'F#m', 'E' => 'C#m', 'B' => 'G#m', 'F#' => 'D#m', 'C#' => 'A#m',
    'F' => 'Dm', 'Bb' => 'Gm', 'Eb' => 'Cm', 'Ab' => 'Fm', 'Db' => 'Bbm', 'Gb' => 'Ebm', 'Cb' => 'Abm',
    'Am' => 'C', 'Em' => 'G', 'Bm' => 'D', 'F#m' => 'A', 'C#m' => 'E', 'G#m' => 'B', 'D#m' => 'F#', 'A#m' => 'C#'
  }

  def initialize(text_with_chords)
    @text = text_with_chords
    @acordes_limpos = extract_and_clean_chords
  end

  # Extrai e limpa os acordes do texto de entrada
  def extract_and_clean_chords
    # Remove marcadores de seção como [Intro] e quebras de linha para isolar os acordes
    cleaned_text = @text.gsub(/\[.*?\]/, '').gsub(/\n/, ' ')

    # Encontra todos os acordes
    acordes_encontrados = cleaned_text.scan(CHORD_REGEX).map do |match|
      root_chord = match[0]
      type = match[1]
      
      # Adiciona o tipo de acorde se for menor (m) ou diminuto (dim) para
      # diferenciar maior/menor na análise.
      if type =~ /m|min/i
        root_chord + 'm'
      elsif type =~ /dim/i
        root_chord + 'dim'
      else
        # Para acordes maiores ou complexos, usamos apenas a raiz
        root_chord
      end
    end.compact.map(&:upcase)

    # Remove duplicatas consecutivas para dar mais peso à progressão
    acordes_filtrados = []
    acordes_encontrados.each do |acorde|
      acordes_filtrados << acorde unless acorde == acordes_filtrados.last
    end

    acordes_filtrados
  end

  # Calcula a pontuação para cada tonalidade
  def calculate_scores
    scores = Hash.new(0)
    
    # 1. Pontuação de frequência: Ocorrências de acordes na escala
    @acordes_limpos.each do |acorde|
      TONALIDADES.each do |key, chords_in_key|
        if chords_in_key.include?(acorde)
          scores[key] += 1
        end
      end
    end
    
    # 2. Pontuação de Tônica (Grau I): O primeiro acorde da música é a tônica
    if @acordes_limpos.first
      first_chord = @acordes_limpos.first
      
      TONALIDADES.each do |key, _|
        # Se o primeiro acorde for a tônica (I ou i)
        if first_chord == key
          scores[key] += 10 # Forte peso para o primeiro acorde ser a tônica
        end
        
        # Bônus para o relativo menor/maior
        # Se o primeiro acorde for o relativo da tonalidade, adiciona um bônus menor.
        relativa = RELATIVAS[key]
        if relativa && first_chord == relativa
            scores[key] += 5 # Bônus na tonalidade se o primeiro acorde for a tônica do relativo
        end
      end
    end

    scores
  end

  # Identifica o tom mais provável
  def detect
    return "Não foi possível identificar o tom. Acordes insuficientes." if @acordes_limpos.empty?

    scores = calculate_scores
    
    # Encontra a tonalidade com a maior pontuação
    best_key = scores.max_by { |key, score| score }
    
    # Formata o resultado
    key_name = best_key[0]
    
    # Determina se é maior ou menor
    # if key_name.end_with?('m')
    #   "Tom: #{key_name.delete('m')} menor"
    # else
    #   "Tom: #{key_name} maior"
    # end
    key_name
  end
end

# --- Exemplo de uso ---
# O usuário fornecerá o texto com letra e cifra.
# O script irá extrair apenas os acordes.

# Se um argumento for passado, usa o conteúdo do arquivo. Caso contrário, usa o exemplo.
# if ARGV[0]
#   file_content = File.read(ARGV[0])
#   detector = KeyDetector.new(file_content)
#   puts detector.detect
# else
#   # Exemplo de entrada (progressão C G Am Em F C G C G7, comum em C maior)
#   exemplo_musica = <<-EOM
# (C)Eu sei que vou te amar
# (G)Por toda a minha vida
# (Am)Eu sei que vou chorar
# (Em)A cada despedida
# (F)Eu sei que vou sofrer
# (C)A eterna dor de amar
# (G)Eu sei que vou viver
# (C)A procurar (G7)você
# EOM

#   # Cria uma instância do detector e executa a detecção
#   detector = KeyDetector.new(exemplo_musica)
#   resultado = detector.detect
#   puts resultado
# end

# --- Como executar ---
# Salve o código acima como detect_key.rb
# Execute no terminal com o exemplo: ruby detect_key.rb
# Execute no terminal com um arquivo: ruby detect_key.rb <caminho_para_arquivo_com_cifra>
