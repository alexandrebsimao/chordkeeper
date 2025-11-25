class SongCacheJob < ApplicationJob
  queue_as :default

  def perform(song_id)
    song = Song.find_by(id: song_id)
    return unless song

    Songs::CachedService.call(song)
  end
end
