module Api
  class SetlistsController < Api::ApiController
    before_action :set_setlist, only: %i[ show edit update destroy manage_songs print save_songs add_song remove_song reorder_songs public_link_generator public_link_destroyer ]

    # GET /setlists or /setlists.json
    def index
      @setlists = Setlists::ListSetlistsService.new(
        conditions: { 
          equal: {
            library_id: current_library.id
          },
          like: {
            title: params[:search].present? ? params[:search].downcase : nil
          }
        },
        page: params[:page],
        per_page: 6
      ).call

      render json: SetlistSerializer.new(@setlists).serializable_hash
    end

    # GET /setlists/1 or /setlists/1.json
    def show
      serialized = SetlistSerializer.new(@setlist).serializable_hash
      
      # Adicionar informações do link público se existir
      if @setlist.public_setlist.present?
        serialized[:data][:attributes][:public_link] = {
          uuid: @setlist.public_setlist.uuid,
          url: "#{request.base_url}/public_setlist/#{@setlist.public_setlist.uuid}"
        }
      end
      
      render json: serialized
    end

    # GET /setlists/1/manage_songs
    def manage_songs
      @library = @setlist.library
    end

    def public_link_generator
      @setlist.generate_public_setlist!
      public_setlist = @setlist.public_setlist
      
      render json: { 
        uuid: public_setlist.uuid,
        url: "#{request.base_url}/public_setlists/#{public_setlist.uuid}"
      }, status: :ok
    end

    def public_link_destroyer
      if @setlist.public_setlist.present?
        @setlist.public_setlist.destroy
        render json: { message: "Link público removido" }, status: :ok
      else
        render json: { error: "Nenhum link público encontrado" }, status: :not_found
      end
    end

    # GET /setlists/1/print
    def print
      pdf = Setlists::MergePdfService.call(@setlist)
      
      send_data pdf,
              filename: "#{@setlist.title}.pdf",
              type: "application/pdf",
              disposition: "inline"
    end

    # POST /setlists/1/save_songs
    def save_songs
      song_order = params[:song_order]
      if song_order
        @setlist.setlist_songs.destroy_all
        song_order.each_with_index do |song_id, index|
          @setlist.setlist_songs.create(song_id: song_id, position: index + 1)
        end
        head :ok
      else
        head :unprocessable_entity
      end
    end

    # POST /setlists/1/add_song
    def add_song
      begin
        song = Song.find(params[:song_id])
        position = @setlist.setlist_songs.count + 1
        @setlist.setlist_songs.create!(song: song, position: position)
        render json: { song_id: song.id, title: song.title }, status: :created
      rescue ActiveRecord::RecordInvalid, ActiveRecord::RecordNotFound => e
        Rails.logger.error("Erro ao adicionar música: #{e.message}")
        head :unprocessable_entity
      end
    end

    # DELETE /setlists/1/remove_song
    def remove_song
      begin
        song = Song.find(params[:song_id])
        @setlist.songs.delete(song)
        head :ok
      rescue ActiveRecord::RecordNotFound => e
        Rails.logger.error("Erro ao remover música: #{e.message}")
        head :not_found
      end
    end

    # GET /setlists/new
    def new
      @setlist = Setlist.new
    end

    # GET /setlists/1/edit
    def edit
    end

    # POST /setlists or /setlists.json
    def create
      @setlist = Setlist.new(setlist_params)
      @setlist.library = current_library
      @setlist.owner = current_user

      if @setlist.save
        render json: SetlistSerializer.new(@setlist).serializable_hash, status: :created, location: @setlist
      else
        render json: @setlist.errors, status: :unprocessable_entity
      end
    end

    # PATCH/PUT /setlists/1 or /setlists/1.json
    def update
      respond_to do |format|
        if @setlist.update(setlist_params)
          format.html { redirect_to @setlist, notice: "Setlist atualizado com sucesso." }
          format.json { render :show, status: :ok, location: @setlist }
        else
          format.html { render :edit, status: :unprocessable_entity }
          format.json { render json: @setlist.errors, status: :unprocessable_entity }
        end
      end
    end

    # DELETE /setlists/1 or /setlists/1.json
    def destroy
      @setlist.destroy!

      render json: { message: "Setlist excluído com sucesso." }, status: :ok
    end

    # PATCH /setlists/:id/reorder_songs
    def reorder_songs
      song_ids = params[:song_ids]
      
      if song_ids.blank? || !song_ids.is_a?(Array)
        render json: { error: "song_ids deve ser um array de IDs" }, status: :unprocessable_entity
        return
      end

      # Update positions for each song in the setlist
      song_ids.each_with_index do |song_id, index|
        setlist_song = @setlist.setlist_songs.find_by(song_id: song_id)
        if setlist_song
          setlist_song.update(position: index + 1)
        end
      end

      render json: SetlistSerializer.new(@setlist.reload).serializable_hash, status: :ok
    rescue => e
      render json: { error: e.message }, status: :unprocessable_entity
    end

    private
      # Use callbacks to share common setup or constraints between actions.
      def set_setlist
        @setlist = Setlist.find(params.expect(:id))
      end

      # Only allow a list of trusted parameters through.
      def setlist_params
        params.expect(setlist: [ :title, :description, :library_id ])
      end
  end
end