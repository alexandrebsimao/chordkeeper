require 'rails_helper'

RSpec.describe Songs::ChordProcessorService, type: :service do
  let(:song) { Song.new(content: '[Intro] E  A9  E  A9
    [Primeira Parte] (2x)
    E               A9
      Este é o meu respirar
    E               A9
      Este é o meu respirar
    E      B       C#m   B4
      Teu Santo Espírito
       A    C#m     B4
    Vivendo     em mim', original_key: 'E', transpose_key: nil) }

  context 'when transpose_key is present' do
    before do
      song.transpose_key = 'D'
    end

    it 'calls the ChordTransposerService and then the SongFormatterService and returns formatted content' do
      result = described_class.new(song).call

      expect(result).to include('<span class="chord">')
      expect(result).to include('[Intro] <span class="chord">D</span>  <span class="chord">G9</span>  <span class="chord">D</span>  <span class="chord">G9</span>')
    end
  end

  context 'when transpose_key is not present' do
    it 'does not call the ChordTransposerService but calls the SongFormatterService' do
      result = described_class.new(song).call

      expect(result).to include('<span class="chord">E</span>  <span class="chord">A9</span>  <span class="chord">E</span>  <span class="chord">A9</span>')
    end
  end
end
