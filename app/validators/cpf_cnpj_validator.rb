class CpfCnpjValidator < ActiveModel::EachValidator
  # 🔒 Validates Brazilian CPF or CNPJ documents
  
  def validate_each(record, attribute, value)
    return if value.blank?

    # Remove formatting
    clean_value = value.to_s.gsub(/\D/, '')

    unless valid_cpf?(clean_value) || valid_cnpj?(clean_value)
      record.errors.add(attribute, options[:message] || 'é inválido')
    end
  end

  private

  def valid_cpf?(cpf)
    return false if cpf.length != 11
    return false if cpf == cpf[0] * 11 # All same digits

    # Luhn-like algorithm for CPF verification
    digits = cpf.chars.map(&:to_i)

    # First check digit
    sum = (0..8).sum { |i| digits[i] * (10 - i) }
    first_digit = 11 - (sum % 11)
    first_digit = 0 if first_digit >= 10

    return false if first_digit != digits[9]

    # Second check digit
    sum = (0..9).sum { |i| digits[i] * (11 - i) }
    second_digit = 11 - (sum % 11)
    second_digit = 0 if second_digit >= 10

    second_digit == digits[10]
  end

  def valid_cnpj?(cnpj)
    return false if cnpj.length != 14
    return false if cnpj == cnpj[0] * 14 # All same digits

    # Luhn-like algorithm for CNPJ verification
    digits = cnpj.chars.map(&:to_i)

    # First check digit
    multipliers = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    sum = multipliers.each_with_index.sum { |m, i| m * digits[i] }
    first_digit = 11 - (sum % 11)
    first_digit = 0 if first_digit >= 10

    return false if first_digit != digits[12]

    # Second check digit
    multipliers = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    sum = multipliers.each_with_index.sum { |m, i| m * digits[i] }
    second_digit = 11 - (sum % 11)
    second_digit = 0 if second_digit >= 10

    second_digit == digits[13]
  end
end
