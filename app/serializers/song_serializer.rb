class SongSerializer
  include JSONAPI::Serializer

  attributes :id, :title, :artist, :genre, :original_key, :transpose_key, :bpm, :capo, :content, :key, :created_at, :updated_at

  has_many :media_references, serializer: MediaReferenceSerializer
  
  attribute :attachment_url do |object|
    if object.attachment.attached?
      Rails.application.routes.url_helpers.rails_blob_url(object.attachment, only_path: false, host: 'http://localhost:3000')
    else
      nil
    end
  end
  
  attribute :print_pdf do |object|
    if object.attachment.attached?
      Rails.application.routes.url_helpers.rails_blob_url(object.attachment, only_path: false, host: 'http://localhost:3000')
    else
      Rails.application.routes.url_helpers.generate_pdf_api_song_url(object, host: 'http://localhost:3000')
    end
  end

  attribute :content_format do |object|
    Songs::ChordProcessorService.call(object)
  end
end
