class LibraryUserSerializer
  include JSONAPI::Serializer
  
  attributes :created_at
  
  attribute :permission do |object|
    object.role.to_s
  end
  
  attribute :user_email do |object|
    object.user.email
  end
  
  attribute :user_name do |object|
    object.user.name || object.user.email
  end
  
  belongs_to :library
  belongs_to :user
end
