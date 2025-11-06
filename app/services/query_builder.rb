module QueryBuilder
  protected

  def apply_like_filter(instance)
    return instance if @conditions[:like].blank?

    conditions = @conditions[:like].map do |key, value|
      next if value.blank?
      sanitized_value = instance.sanitize_sql_like(value)
      "LOWER(#{key}) LIKE LOWER(?)"
    end.compact

    values = @conditions[:like].values.reject(&:blank?).map { |v| "%#{v}%" }
    
    instance = instance.where(conditions.join(' OR '), *values) if conditions.any?

    instance
  end

  def apply_equal_filters(instance)
    equal_conditions = @conditions[:equal].select { |k, v| v.present? }
    instance = instance.where(equal_conditions)
    instance
  end
end