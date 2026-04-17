# EXEMPLO: Como integrar limite de cifras ao Songs Controller
# Arquivo: app/controllers/api/songs_controller.rb

# Adicione ao topo da classe:
#
# include Concerns::QuotaValidation
# before_action :check_quota!, only: [:create]
#

# ============================================================================
# Exemplo 1: Usando before_action com concern
# ============================================================================
#
# class Api::SongsController < Api::ApiController
#   include Concerns::QuotaValidation
#   before_action :check_quota!, only: [:create]
#
#   def create
#     @song = Song.new(song_params)
#     @song.library = current_library
#
#     if @song.save
#       render json: SongSerializer.new(@song, { include: [:media_references] }).serializable_hash, 
#              status: :created, 
#              location: @song
#     else
#       render json: @song.errors, status: :unprocessable_entity
#     end
#   end
# end

# ============================================================================
# Exemplo 2: Validação Manual no método create
# ============================================================================
#
# def create
#   quota = Quota::SongLimitService.new(current_user)
#   unless quota.can_create?
#     return render json: { 
#       error: quota.error_message,
#       quota: quota.status
#     }, status: :unprocessable_entity
#   end
#
#   @song = Song.new(song_params)
#   @song.library = current_library
#
#   if @song.save
#     render json: SongSerializer.new(@song).serializable_hash, status: :created
#   else
#     render json: @song.errors, status: :unprocessable_entity
#   end
# end

# ============================================================================
# Exemplo 3: Usando helper do modelo
# ============================================================================
#
# def create
#   unless current_user.can_create_song?
#     quota = current_user.song_quota
#     return render json: { 
#       error: quota.error_message,
#       quota: quota.status
#     }, status: :unprocessable_entity
#   end
#
#   @song = Song.new(song_params)
#   # ... resto do código
# end

# ============================================================================
# Exemplo 4: Método index retornando info de quota
# ============================================================================
#
# def index
#   @songs = Songs::ListSongsService.new(
#     conditions: { 
#       equal: { library_id: current_library.id },
#       like: {
#         title: params[:search].present? ? params[:search].downcase : nil,
#         artist: params[:search].present? ? params[:search].downcase : nil
#       }
#     },
#     page: params[:page],
#     per_page: params[:per_page] || 6
#   ).call
#
#   quota = current_user.song_quota
#
#   render json: {
#     songs: SongSerializer.new(@songs, { include: [:media_references] }).serializable_hash,
#     quota: quota.status,
#     warning: quota.warning_message
#   }
# end

# ============================================================================
# Resposta de Exemplo - GET /api/songs
# ============================================================================
#
# {
#   "songs": [
#     { "id": 1, "title": "Amazing Grace", "artist": "..." },
#     { "id": 2, "title": "Hallelujah", "artist": "..." }
#   ],
#   "quota": {
#     "plan": "Free",
#     "limit": 10,
#     "limit_label": "10 cifra(s)",
#     "used": 8,
#     "available": 2,
#     "percentage": 80.0,
#     "can_create": true,
#     "near_limit": true,
#     "at_limit": false
#   },
#   "warning": "⚠️ Você está usando 80% do limite de cifras. Tem 2 cifra(s) disponível(eis)."
# }

# ============================================================================
# Resposta de Exemplo - POST /api/songs (Sem quota)
# ============================================================================
#
# HTTP/1.1 422 Unprocessable Entity
#
# {
#   "error": "Você atingiu o limite de 10 cifra(s) do plano Free. Tem 10 cifra(s). Para criar mais, faça upgrade de plano.",
#   "quota": {
#     "plan": "Free",
#     "limit": 10,
#     "limit_label": "10 cifra(s)",
#     "used": 10,
#     "available": 0,
#     "percentage": 100.0,
#     "can_create": false,
#     "near_limit": true,
#     "at_limit": true
#   }
# }
