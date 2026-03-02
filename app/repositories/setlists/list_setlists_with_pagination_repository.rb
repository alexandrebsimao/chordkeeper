module Setlists
  class ListSetlistsWithPaginationRepository
    def initialize(model = Setlist)
      @model = model
    end

    def call(conditions: {}, user: nil, page: 1, per_page: 10)
      @model
        .where(conditions)
        .joins(:setlist_users)
        .where(setlist_users: { user_id: user.id })
        .paginate(page: page, per_page: per_page).order(:title)
    end
  end
end