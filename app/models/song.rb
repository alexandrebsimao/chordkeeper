class Song < ApplicationRecord
  NOTES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'].freeze

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
  after_commit :enqueue_cache_job, on: [:create, :update]

  def set_original_key_if_missing
    if self.original_key.blank? && self.content.present?
      detector = KeyDetector.new(self.content)
      detected_key = detector.detect
      self.original_key = detected_key unless detected_key.start_with?("Não foi possível")
    end
  end

  def key
    transpose_key.present? ? transpose_key : original_key
  end

  def pdf_to_text!
    return nil unless attachment.attached? && attachment.blob.content_type == 'application/pdf'

    pdf_content = ''
    reader = PDF::Reader.new(StringIO.new(attachment.download))
    reader.pages.each do |page|
      pdf_content += page.text + "\n"
    end
    pdf_content.strip

    self.content = pdf_content
    self.save!
  end

  private

  def enqueue_cache_job
    SongCacheJob.perform_later(self.id)
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

    unless attachment.blob.byte_size <= 100.megabytes
      errors.add(:attachment, 'deve ser menor que 100MB')
    end
  end
end
