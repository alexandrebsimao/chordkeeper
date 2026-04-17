class CustomerDataValidator
  # 🔒 Validates customer data before payment processing
  
  attr_reader :errors

  def initialize(data)
    @data = data
    @errors = {}
  end

  def valid?
    validate_all
    @errors.empty?
  end

  private

  def validate_all
    validate_name
    validate_document
    validate_phone
  end

  def validate_name
    name = @data[:name].to_s.strip

    if name.empty?
      @errors[:name] = "Nome é obrigatório"
    elsif name.length < 3
      @errors[:name] = "Nome deve ter pelo menos 3 caracteres"
    elsif name.length > 150
      @errors[:name] = "Nome não pode exceder 150 caracteres"
    end
  end

  def validate_document
    document = @data[:document].to_s.gsub(/\D/, '')

    if document.empty?
      @errors[:document] = "CPF ou CNPJ é obrigatório"
    elsif !valid_cpf?(document) && !valid_cnpj?(document)
      @errors[:document] = "CPF ou CNPJ inválido"
    end
  end

  def validate_phone
    phone = @data[:phone].to_s.gsub(/\D/, '')

    if phone.empty?
      @errors[:phone] = "Telefone é obrigatório"
    elsif phone.length < 10
      @errors[:phone] = "Telefone inválido"
    elsif phone.length > 11
      @errors[:phone] = "Telefone inválido"
    end
  end

  def valid_cpf?(cpf)
    return false if cpf.length != 11
    return false if cpf == cpf[0] * 11

    digits = cpf.chars.map(&:to_i)

    sum = (0..8).sum { |i| digits[i] * (10 - i) }
    first_digit = 11 - (sum % 11)
    first_digit = 0 if first_digit >= 10

    return false if first_digit != digits[9]

    sum = (0..9).sum { |i| digits[i] * (11 - i) }
    second_digit = 11 - (sum % 11)
    second_digit = 0 if second_digit >= 10

    second_digit == digits[10]
  end

  def valid_cnpj?(cnpj)
    return false if cnpj.length != 14
    return false if cnpj == cnpj[0] * 14

    digits = cnpj.chars.map(&:to_i)

    multipliers = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    sum = multipliers.each_with_index.sum { |m, i| m * digits[i] }
    first_digit = 11 - (sum % 11)
    first_digit = 0 if first_digit >= 10

    return false if first_digit != digits[12]

    multipliers = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    sum = multipliers.each_with_index.sum { |m, i| m * digits[i] }
    second_digit = 11 - (sum % 11)
    second_digit = 0 if second_digit >= 10

    second_digit == digits[13]
  end
end
