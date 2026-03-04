# app/services/chordpro_converter_service.rb
class ChordproConverterService
  CHORD_RE = /[A-G][#b]?(?:m|maj|min|dim|aug|sus|add|M)?(?:\d+[Mm]?)?(?:\/[A-G][#b]?)?/

  def self.chord_line?(line)
    stripped = line.strip
    return false if stripped.empty?
    tokens = stripped.split
    tokens.all? { |t| t.match?(/\A#{CHORD_RE}\z/) }
  end

  def self.merge_chord_lyric(chord_line, lyric_line)
    chords_at = {}
    col = 0
    i   = 0
    while i < chord_line.length
      if chord_line[i] == ' '
        col += 1
        i   += 1
      else
        j = i
        j += 1 while j < chord_line.length && chord_line[j] != ' '
        chords_at[col] = chord_line[i...j]
        col += (j - i)
        i    = j
      end
    end

    result = ""
    lyric_line = lyric_line.dup.rstrip
    max_col = chords_at.keys.max || 0
    lyric_line = lyric_line.ljust(max_col + 1) if lyric_line.length <= max_col
    col = 0
    lyric_line.each_char do |ch|
      result << "[#{chords_at[col]}]" if chords_at.key?(col)
      result << ch
      col += 1
    end
    chords_at.each do |c, chord|
      result << "[#{chord}]" if c >= lyric_line.length
    end
    result.rstrip
  end

  def self.convert(input)
    lines  = input.lines.map(&:rstrip)
    output = []
    in_section    = false
    pending_chord = nil
    i = 0
    close_section = lambda do
      if in_section
        output << "{end_of_verse}"
        output << ""
        in_section = false
      end
    end
    while i < lines.length
      line = lines[i]
      if line.strip =~ /\A\[(.+)\]\z/
        section_name = $1
        if pending_chord
          output << pending_chord.strip.split.map { |c| "[#{c}]" }.join(' ')
          pending_chord = nil
        end
        close_section.call
        output << "{start_of_verse: #{section_name}}"
        in_section = true
        i += 1
        next
      end
      if line.strip =~ /\A\[(.+)\]\s+(.+)\z/
        section_name = $1
        rest         = $2
        close_section.call
        output << "{start_of_verse: #{section_name}}"
        in_section = true
        if chord_line?(rest)
          chordpro = rest.strip.split.map { |c| "[#{c}]" }.join("  ")
          output << chordpro
        else
          output << rest
        end
        i += 1
        next
      end
      if line.strip.empty?
        if pending_chord
          chordpro = pending_chord.strip.split.map { |c| "[#{c}]" }.join("  ")
          output << chordpro
          pending_chord = nil
        end
        output << ""
        i += 1
        next
      end
      if line.strip =~ /\A\((.+)\)\z/
        inner = $1.strip
        if chord_line?(inner)
          chordpro = inner.split.map { |c| "[#{c}]" }.join("  ")
          output << "(#{chordpro})"
        else
          output << line
        end
        i += 1
        next
      end
      if chord_line?(line)
        if pending_chord
          chordpro = pending_chord.strip.split.map { |c| "[#{c}]" }.join("  ")
          output << chordpro
        end
        pending_chord = line
        i += 1
        next
      end
      if pending_chord
        merged = merge_chord_lyric(pending_chord, line)
        output << merged
        pending_chord = nil
      else
        output << line.rstrip
      end
      i += 1
    end
    if pending_chord
      chordpro = pending_chord.strip.split.map { |c| "[#{c}]" }.join("  ")
      output << chordpro
    end
    close_section.call
    output.join("\n")
  end
end
