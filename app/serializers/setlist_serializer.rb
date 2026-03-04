class SetlistSerializer
  include JSONAPI::Serializer

  attributes :id, :title, :description, :library_id, :owner_id, :created_at, :updated_at

  attribute :songs do |object|
    object.songs.order('setlist_songs.position ASC').map do |song|
      SongSerializer.new(song).serializable_hash
    end
  end

  attribute :all_songs do |object|
    object.songs.map do |song|
      SongSerializer.new(song).serializable_hash
    end
  end

  attribute :total_songs do |object|
    object.songs.count
  end

  attribute :owner_name do |object|
    object.owner&.name || object.owner&.email
  end

  attribute :shared_users do |object|
    object.setlist_users.map do |su|
      {
        id: su.id,
        user_id: su.user_id,
        user_name: su.user.name || su.user.email,
        user_email: su.user.email,
        permission: su.role
      }
    end
  end
end
