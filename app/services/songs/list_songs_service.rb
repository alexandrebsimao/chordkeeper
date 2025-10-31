module Songs
  class ListSongsService < ApplicationService
    include QueryBuilder

    def initialize(conditions: {}, filter: {}, page: 1, per_page: 10)
      @conditions = conditions
      @filter = filter
      @page = page
      @per_page = per_page
    end

    def call
      song = Song
      song = apply_like_filter(song)
      song = apply_equal_filters(song)

      Songs::ListSongsWithPaginationRepository.new(
        song
      ).call(
        page: @page,
        per_page: @per_page
      )
    end
  end
end