module Setlists
  class ListSetlistsService < ApplicationService
    include QueryBuilder

    def initialize(user:, conditions: {}, filter: {}, page: 1, per_page: 10)
      @user = user
      @conditions = conditions
      @filter = filter
      @page = page
      @per_page = per_page
    end

    def call
      setlist = Setlist
      setlist = apply_like_filter(setlist)
      setlist = apply_equal_filters(setlist)

      Setlists::ListSetlistsWithPaginationRepository.new(
        setlist
      ).call(
        user: @user,
        page: @page,
        per_page: @per_page
      )
    end
  end
end