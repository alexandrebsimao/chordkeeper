module Payments
  class ProviderFactory
    def self.build(provider_name = nil)
      provider = (provider_name || ENV.fetch("PAYMENT_PROVIDER", "mock")).to_s

      case provider
      when "mock"
        Payments::MockProvider.new
      when "asaas"
        Payments::AsaasProvider.new
      else
        raise Payments::BaseProvider::ProviderError, "Provedor de pagamento não suportado: #{provider}"
      end
    end
  end
end
