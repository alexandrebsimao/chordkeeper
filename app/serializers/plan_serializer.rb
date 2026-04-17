class PlanSerializer
  include JSONAPI::Serializer

  attributes :name, :description, :price_cents, :interval, :duration_days,
             :max_songs, :max_setlists, :max_collaborators, :active, :sort_order

  def formatted_price
    format("%.2f", object.price_cents.to_f / 100.0)
  end

  attribute :features_list do
    object.features_list
  end
end
