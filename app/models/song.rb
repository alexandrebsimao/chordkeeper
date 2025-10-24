class Song < ApplicationRecord
  include ChordTransposer

  NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].freeze

  belongs_to :library
  has_one_attached :attachment
  
  validates :title, presence: true
  validate :acceptable_attachment, if: -> { attachment.attached? }

  before_save :set_original_key_if_missing

  def set_original_key_if_missing
    if self.original_key.blank? && self.content.present?
      detector = KeyDetector.new(self.content)
      detected_key = detector.detect
      self.original_key = detected_key unless detected_key.start_with?("Não foi possível")
    end
  end

  def transposed_content(to_key)
    semitones = calculate_interval(self.original_key, to_key)
    return content unless semitones != 0
    transposed_lines = content.lines.map do |line|
      if chord_line?(line)
        transpose_chord_line(line, semitones)
      else
        line
      end
    end
    transposed_lines.join
  end

  def key
    transpose_key.present? ? transpose_key : original_key
  end

  private

  def acceptable_attachment
    return unless attachment.attached?

    unless attachment.blob.content_type.in?(%w[
      application/pdf application/msword 
      application/vnd.openxmlformats-officedocument.wordprocessingml.document 
      text/plain
    ])
      errors.add(:attachment, 'deve ser um arquivo do tipo permitido (PDF, DOC, DOCX, TXT)')
    end

    unless attachment.blob.byte_size <= 100.megabytes
      errors.add(:attachment, 'deve ser menor que 100MB')
    end
  end
end
