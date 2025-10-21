json.extract! song, :id, :title, :artist, :album, :genre, :key, :bpm, :duration, :content, :content_type, :attachment, :library_id, :created_at, :updated_at
json.url song_url(song, format: :json)
