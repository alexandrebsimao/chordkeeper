module QueryBuilder
  protected

  def apply_like_filter(instance)
    return instance if @conditions[:like].blank?

    @conditions[:like].each do |key, value|
      next if value.blank?

      sanitized_value = instance.sanitize_sql_like(value)
      instance = instance.where("LOWER(#{key.to_s}) LIKE LOWER(?)", "%#{sanitized_value}%")
    end

    instance
  end

  def apply_equal_filters(instance)
    equal_conditions = @conditions[:equal].select { |k, v| v.present? }
    instance = instance.where(equal_conditions)
    instance
  end
end