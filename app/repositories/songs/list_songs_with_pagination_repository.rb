module Songs
  class ListSongsWithPaginationRepository
    def initialize(model = Song)
      @model = model
    end

    def call(conditions: {}, page: 1, per_page: 10)
      @model.where(conditions).paginate(page: page, per_page: per_page).order(:title)
    end
  end
end