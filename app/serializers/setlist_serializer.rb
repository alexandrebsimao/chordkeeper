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
end
