require 'base64'

class SongPdfCache < ApplicationRecord
  belongs_to :song
  
  validates :font_size, presence: true, inclusion: { in: 12..24 }
  validates :pdf_data, presence: true
  validates :font_size, uniqueness: { scope: :song_id }
  
  # Serializa o pdf_data como base64
  def pdf_binary=(binary_data)
    self.pdf_data = Base64.strict_encode64(binary_data)
  end
  
  def pdf_binary
    return nil unless pdf_data
    Base64.strict_decode64(pdf_data)
  end
end
