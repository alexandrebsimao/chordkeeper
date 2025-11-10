class MediaReferenceSerializer
  include JSONAPI::Serializer

  attributes :id, :media_type, :url, :description, :created_at, :updated_at

  attribute :file_url do |object|
    if object.attachment.attached?
      Rails.application.routes.url_helpers.rails_blob_url(object.attachment, only_path: false, host: 'http://localhost:3000')
    else
      nil
    end
  end
end
