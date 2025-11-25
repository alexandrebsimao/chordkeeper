class LibrarySerializer
  include JSONAPI::Serializer
  
  attributes :name, :description, :owner_id, :created_at, :updated_at
  
  belongs_to :user, key: :owner
end
