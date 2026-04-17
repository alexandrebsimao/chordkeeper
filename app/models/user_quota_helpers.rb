# Adicione estes métodos ao modelo User para facilitar acesso a quotas
# Arquivo: app/models/user.rb

# ============================================================================
# Métodos para adicionar à classe User
# ============================================================================

def song_quota
  @song_quota ||= Quota::SongLimitService.new(self)
end

# Helpers convenientes
def can_create_song?
  song_quota.can_create?
end

def song_limit
  song_quota.limit
end

def songs_count
  song_quota.songs_count
end

def song_quota_status
  song_quota.status
end

def song_quota_percentage
  song_quota.usage_percentage
end

def near_song_limit?
  song_quota.near_limit?
end

def at_song_limit?
  song_quota.at_limit?
end
