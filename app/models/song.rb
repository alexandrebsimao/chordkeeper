class Song < ApplicationRecord
  NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].freeze
  MAX_PDF_PAGES_TO_PARSE = 120
  MAX_EXTRACTED_CONTENT_CHARS = 300_000
  MAX_FILE_SIZE_BY_CONTENT_TYPE = {
    "application/pdf" => 15.megabytes,
    "application/msword" => 10.megabytes,
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document" => 10.megabytes,
    "text/plain" => 5.megabytes
  }.freeze

  belongs_to :library

  has_many :setlist_songs, dependent: :destroy
  has_many :setlists, through: :setlist_songs
  has_many :media_references, dependent: :destroy
  has_many :song_pdf_caches, class_name: 'SongPdfCache', dependent: :destroy

  has_one_attached :attachment

  accepts_nested_attributes_for :media_references, 
    allow_destroy: true, 
    reject_if: :all_blank
  
  validates :title, presence: true
  validates :capo, numericality: { only_integer: true, greater_than_or_equal_to: 0, less_than_or_equal_to: 12, allow_nil: true }
  validate :acceptable_attachment, if: -> { attachment.attached? }

  before_save :set_original_key_if_missing
  before_save :pdf_to_text!, if: -> { convert_pdf? }
  before_save :capo_to_nil_if_zero
  before_save :content_to_chordpro
  # after_commit :enqueue_cache_job, on: [:create, :update]

  def set_original_key_if_missing
    if self.original_key.blank? && self.content.present?
      detector = KeyDetector.new(self.content)
      detected_key = detector.detect
      self.original_key = detected_key unless detected_key.start_with?("Não foi possível")
    end
  end

  # Converte linhas de acordes acima das letras para formato ChordPro
  def convert_chords_above_to_chordpro(text)
    ChordproConverterService.convert(text)
  end

  def content_to_chordpro
    return content if content.blank?

    # Primeiro converte linhas de acordes acima das letras para ChordPro
    # chordpro_text = convert_chords_above_to_chordpro(content)
    lines = content.split("\n")
    chordpro_lines = lines.map do |line|
      parse_chordpro_line_with_position(line).map do |part|
        part
      end
    end

    self.lyrics = chordpro_lines
    # self.content = chordpro_text
  end

  def parse_chordpro_line_with_position(line)
    result = []
    regex = /\[([^\]]+)\]/
    last_index = 0

    line.scan(regex) do |match|
      chord = match[0]
      chord_start = Regexp.last_match.begin(0)
      chord_end = Regexp.last_match.end(0)
      # Texto antes do acorde
      if chord_start > last_index
        text = line[last_index...chord_start]
        position = text&.length || 2
        result << { chord: nil, text: text, pos: position } unless text.empty?
      end
      # Texto após o acorde
      next_chord_start = line.index('[', chord_end) || line.length
      text = line[chord_end...next_chord_start]
      position = text&.length || 2
      result << { chord: chord, text: text, pos: position } unless text.empty?
      last_index = chord_end + text.length
    end
    # Texto final sem acorde
    if last_index < line.length
      text = line[last_index..-1]
      position = text&.length || 2
      result << { chord: nil, text: text, pos: position } unless text.empty?
    end
    result
  end

  def key
    transpose_key.present? ? transpose_key : original_key
  end

  def pdf_to_text!
    return nil unless attachment.attached? && attachment.blob.content_type == 'application/pdf'

    reader = PDF::Reader.new(StringIO.new(attachment.download))
    if reader.page_count > MAX_PDF_PAGES_TO_PARSE
      errors.add(:attachment, "PDF muito grande (máximo de #{MAX_PDF_PAGES_TO_PARSE} páginas para conversão)")
      throw(:abort)
    end

    extracted_pages = reader.pages.first(MAX_PDF_PAGES_TO_PARSE).map(&:text)
    self.content = extracted_pages.join("\n").slice(0, MAX_EXTRACTED_CONTENT_CHARS)
  rescue PDF::Reader::MalformedPDFError, PDF::Reader::UnsupportedFeatureError
    errors.add(:attachment, "PDF inválido ou não suportado para conversão")
    throw(:abort)
  end

  private

  def enqueue_cache_job
    SongCacheJob.perform_later(self.id)
  rescue RedisClient::CannotConnectError, Redis::CannotConnectError => e
    Rails.logger.warn "Redis not available, skipping cache job: #{e.message}"
  end

  def capo_to_nil_if_zero
    self.capo = nil if self.capo == 0
  end

  def convert_pdf?
    attachment.attached? && attachment.blob.content_type == 'application/pdf' && content.blank? && self.convert_pdf
  end

  def acceptable_attachment
    return unless attachment.attached?

    unless attachment.blob.content_type.in?(%w[
      application/pdf application/msword 
      application/vnd.openxmlformats-officedocument.wordprocessingml.document 
      text/plain
    ])
      errors.add(:attachment, 'deve ser um arquivo do tipo permitido (PDF, DOC, DOCX, TXT)')
    end

    max_size = MAX_FILE_SIZE_BY_CONTENT_TYPE[attachment.blob.content_type]
    return if max_size.nil?

    unless attachment.blob.byte_size <= max_size
      errors.add(:attachment, "deve ser menor que #{max_size / 1.megabyte}MB")
    end
  end
end
