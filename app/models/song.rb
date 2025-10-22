class Song < ApplicationRecord
  belongs_to :library
  has_one_attached :attachment
  
  validates :title, presence: true
  validate :acceptable_attachment, if: -> { attachment.attached? }

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
