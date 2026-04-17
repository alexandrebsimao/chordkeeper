require 'net/http'
require 'json'

module Payments
  class AsaasProvider < BaseProvider
    API_BASE = 'https://api.asaas.com/v3'.freeze
    
    ProviderError = Class.new(StandardError)
    AsaasAPIError = Class.new(ProviderError)

    def initialize
      @api_key = ENV.fetch('ASAAS_API_KEY', nil)
      @sandbox = ENV.fetch('ASAAS_SANDBOX', 'true').to_s == 'true'
      
      if @api_key.blank?
        raise ProviderError, 'ASAAS_API_KEY não configurada'
      end
    end

    # Cria uma assinatura no Asaas
    # @param user [User] Usuário criando assinatura
    # @param plan [Plan] Plano selecionado
    # @param payment_data [Hash] Dados de pagamento (cartão, cpf, etc)
    # @param customer_data [Hash] Dados do cliente
    def create_subscription(user:, plan:, payment_data:, customer_data:)

      # Primeiro, cria ou recupera cliente
      customer = ensure_customer(user, customer_data)
      
      # Calcula o ciclo de cobrança
      billing_type = determine_billing_type(payment_data)
      next_due_date = (Time.current + 1.day).strftime('%Y-%m-%d')
      
      # Dados da assinatura
      subscription_data = {
        customer: customer[:id],
        billingType: billing_type,
        nextDueDate: next_due_date,
        value: plan.formatted_price,
        cycle: normalize_cycle(plan.interval),
        description: "Assinatura - #{plan.name}",
        maxPayments: plan.interval == 'year' ? 12 : nil,
        metadata: {
          chord_keeper_plan_id: plan.id,
          chord_keeper_user_id: user.id
        }
      }.compact
      
      # Adiciona dados de pagamento conforme tipo
      subscription_data.merge!(prepare_payment_data(payment_data, billing_type))
      
      # Cria assinatura na API
      response = post('/subscriptions', subscription_data)
      
      {
        external_subscription_id: response['id'],
        provider: 'asaas',
        payment_method_brand: extract_brand(response, payment_data),
        payment_method_last4: extract_last4(response, payment_data),
        payment_method_token: response['id'],
        customer_name: customer_data[:name] || user.name,
        customer_document: customer_data[:document],
        customer_phone: customer_data[:phone],
        status: map_status(response['status']),
        started_at: Time.current,
        expires_at: Time.current + plan.duration_days.days
      }
    rescue Faraday::ClientError => e
      raise AsaasAPIError, parse_error_message(e.response[:body])
    end

    # Atualiza método de pagamento de uma assinatura
    def update_payment_method(external_subscription_id:, payment_data:)
      # Recupera assinatura para atualizar dados
      response = get("/subscriptions/#{external_subscription_id}")
      
      # Atualiza dados de pagamento
      update_data = prepare_payment_data(payment_data, response['billingType'])
      
      updated = patch("/subscriptions/#{external_subscription_id}", update_data)
      
      {
        external_subscription_id: updated['id'],
        payment_method_brand: extract_brand(updated, payment_data),
        payment_method_last4: extract_last4(updated, payment_data),
        payment_method_token: updated['id']
      }
    rescue Faraday::ClientError => e
      raise AsaasAPIError, parse_error_message(e.response[:body])
    end

    # Cancela uma assinatura
    def cancel_subscription(external_subscription_id:)
      # Asaas não deleta, apenas desativa
      response = delete("/subscriptions/#{external_subscription_id}")
      
      {
        external_subscription_id: external_subscription_id,
        cancelled_at: Time.current,
        status: 'cancelled'
      }
    rescue Faraday::ClientError => e
      raise AsaasAPIError, parse_error_message(e.response[:body])
    end

    # Renova uma assinatura (cria novo ciclo)
    def renew_subscription(external_subscription_id:, plan:, payment_data:)
      # Recupera assinatura atual
      subscription = get("/subscriptions/#{external_subscription_id}")
      
      # Reativa se necessário
      unless subscription['status'].in?(['ACTIVE', 'PENDING'])
        reactivate_subscription(external_subscription_id)
      end
      
      {
        external_subscription_id: external_subscription_id,
        payment_method_brand: extract_brand(subscription, payment_data),
        payment_method_last4: extract_last4(subscription, payment_data),
        payment_method_token: external_subscription_id,
        expires_at: Time.current + plan.duration_days.days,
        status: UserSubscription::STATUSES[:active]
      }
    rescue Faraday::ClientError => e
      raise AsaasAPIError, parse_error_message(e.response[:body])
    end

    private

    # === HTTP Helpers ===

    def post(path, data = {})
      response = http_client.post(path) do |req|
        req.body = data.to_json
      end
      JSON.parse(response.body)
    end

    def get(path)
      response = http_client.get(path)
      JSON.parse(response.body)
    end

    def patch(path, data = {})
      response = http_client.patch(path) do |req|
        req.body = data.to_json
      end
      JSON.parse(response.body)
    end

    def delete(path)
      response = http_client.delete(path)
      JSON.parse(response.body)
    end

    def http_client
      @http_client ||= Faraday.new(
        url: API_BASE,
        headers: {
          'Content-Type' => 'application/json',
          'Authorization' => "Bearer #{@api_key}"
        },
        request: { timeout: 30 }
      )
    end

    # === Asaas Helpers ===

    def ensure_customer(user, customer_data)
      document = customer_data[:document]
      
      # Tenta encontrar cliente por documento
      response = get('/customers', { cpfCnpj: document })
      
      if response['data']&.any?
        # Cliente existe
        response['data'].first
      else
        # Cria novo cliente
        create_customer(user, customer_data)
      end
    rescue Faraday::ClientError => e
      # Se falhar na busca, cria novo
      create_customer(user, customer_data)
    end

    def create_customer(user, customer_data)
      customer_payload = {
        name: customer_data[:name] || user.name,
        email: user.email,
        phone: customer_data[:phone],
        cpfCnpj: customer_data[:document],
        notificationDisabled: false
      }.compact
      
      response = post('/customers', customer_payload)
      response
    end

    def determine_billing_type(payment_data)
      'CREDIT_CARD'
    end

    def normalize_cycle(interval)
      case interval
      when 'month'
        'MONTHLY'
      when 'year'
        'YEARLY'
      else
        'MONTHLY'
      end
    end

    def prepare_payment_data(payment_data, billing_type)
      # Normalize key names (accept both snake_case and camelCase)
      holder_name = payment_data[:holder_name] || payment_data[:holderName]
      expiry_month = payment_data[:expiry_month] || payment_data[:expiryMonth]
      expiry_year = payment_data[:expiry_year] || payment_data[:expiryYear]
      
      case billing_type
      when 'CREDIT_CARD'
        {
          creditCard: {
            holderName: holder_name,
            number: payment_data[:number],
            expiryMonth: expiry_month,
            expiryYear: expiry_year,
            ccv: payment_data[:ccv]
          },
          creditCardToken: payment_data[:token]
        }.compact
      else
        {}
      end
    end

    def reactivate_subscription(subscription_id)
      response = post("/subscriptions/#{subscription_id}/reactivate", {})
      response
    end

    def extract_brand(response, payment_data)
      case response['billingType']
      when 'CREDIT_CARD'
        payment_data[:brand] || extract_card_brand(response['creditCard']&.dig('number'))
      when 'DEBIT_CARD'
        payment_data[:brand] || 'debit'
      when 'PIX'
        'pix'
      when 'BOLETO'
        'boleto'
      else
        'unknown'
      end
    end

    def extract_last4(response, payment_data)
      case response['billingType']
      when 'CREDIT_CARD'
        payment_data[:last4] || response['creditCard']&.dig('number')&.last(4)
      when 'DEBIT_CARD'
        payment_data[:last4] || response['debitCard']&.dig('number')&.last(4)
      when 'PIX'
        'pix'
      when 'BOLETO'
        'boleto'
      else
        'unknown'
      end
    end

    def extract_card_brand(card_number)
      return 'unknown' if card_number.blank?
      
      case card_number
      when /^4\d{12}(\d{3})?$/
        'visa'
      when /^5[1-5]\d{14}$/, /^2[2-7]\d{14}$/
        'mastercard'
      when /^3[47]\d{13}$/
        'amex'
      when /^6(?:011|5)\d{12}$/
        'discover'
      else
        'unknown'
      end
    end

    def map_status(asaas_status)
      case asaas_status
      when 'ACTIVE'
        UserSubscription::STATUSES[:active]
      when 'INACTIVE', 'CANCELLED'
        UserSubscription::STATUSES[:cancelled]
      when 'PENDING'
        UserSubscription::STATUSES[:active] # Consideramos pending como active
      else
        UserSubscription::STATUSES[:active]
      end
    end

    def parse_error_message(response_body)
      begin
        body = JSON.parse(response_body)
        
        if body['errors']&.any?
          body['errors'].map { |e| e['detail'] }.join(', ')
        elsif body['error']
          body['error']
        else
          body.to_s
        end
      rescue JSON::ParserError
        response_body
      end
    end
  end
end
