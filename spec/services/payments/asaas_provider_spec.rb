require 'rails_helper'

RSpec.describe Payments::AsaasProvider, type: :service do
  let(:provider) { described_class.new }
  let(:user) { create(:user, email: 'test@example.com', name: 'John Doe') }
  let(:plan) { create(:plan, price_cents: 9999, interval: 'month', duration_days: 30) }
  
  let(:payment_data) do
    {
      method: 'credit_card',
      number: '4111111111111111',
      expiry_month: '12',
      expiry_year: '2026',
      ccv: '123',
      holder_name: 'John Doe',
      brand: 'visa',
      last4: '1111'
    }
  end
  
  let(:customer_data) do
    {
      name: 'John Doe',
      document: '12345678901',
      phone: '11999999999'
    }
  end

  before do
    allow(ENV).to receive(:fetch).and_call_original
    allow(ENV).to receive(:fetch).with('ASAAS_API_KEY', nil).and_return('test_api_key')
    allow(ENV).to receive(:fetch).with('ASAAS_SANDBOX', 'true').and_return('true')
  end

  describe 'initialization' do
    it 'initializes with valid API key' do
      expect { described_class.new }.not_to raise_error
    end

    it 'raises error when ASAAS_API_KEY is missing' do
      allow(ENV).to receive(:fetch).with('ASAAS_API_KEY', nil).and_return(nil)
      expect { described_class.new }.to raise_error(Payments::BaseProvider::ProviderError)
    end
  end

  describe '#create_subscription' do
    let(:mock_customer_response) do
      {
        'id' => 'cus_123456',
        'name' => 'John Doe',
        'email' => 'test@example.com'
      }
    end

    let(:mock_subscription_response) do
      {
        'id' => 'sub_987654',
        'status' => 'ACTIVE',
        'customer' => 'cus_123456',
        'billingType' => 'CREDIT_CARD',
        'creditCard' => {
          'number' => '**** **** **** 1111',
          'expiryMonth' => '12',
          'expiryYear' => '2026'
        }
      }
    end

    before do
      allow_any_instance_of(described_class).to receive(:get).and_return(mock_customer_response)
      allow_any_instance_of(described_class).to receive(:post).and_return(mock_subscription_response)
    end

    it 'creates a subscription successfully' do
      result = provider.create_subscription(
        user: user,
        plan: plan,
        payment_data: payment_data,
        customer_data: customer_data
      )

      expect(result).to include(
        external_subscription_id: 'sub_987654',
        provider: 'asaas',
        status: UserSubscription::STATUSES[:active]
      )
    end

    it 'sets correct expiry date based on plan duration' do
      result = provider.create_subscription(
        user: user,
        plan: plan,
        payment_data: payment_data,
        customer_data: customer_data
      )

      expected_expiry = Time.current + plan.duration_days.days
      expect(result[:expires_at]).to be_within(1.minute).of(expected_expiry)
    end

    it 'extracts payment method details correctly' do
      result = provider.create_subscription(
        user: user,
        plan: plan,
        payment_data: payment_data,
        customer_data: customer_data
      )

      expect(result[:payment_method_brand]).to eq('visa')
      expect(result[:payment_method_last4]).to eq('1111')
      expect(result[:payment_method_token]).to eq('sub_987654')
    end

    it 'stores customer data' do
      result = provider.create_subscription(
        user: user,
        plan: plan,
        payment_data: payment_data,
        customer_data: customer_data
      )

      expect(result[:customer_name]).to eq(customer_data[:name])
      expect(result[:customer_document]).to eq(customer_data[:document])
      expect(result[:customer_phone]).to eq(customer_data[:phone])
    end
  end

  describe '#update_payment_method' do
    let(:new_payment_data) do
      {
        method: 'credit_card',
        number: '5555555555554444',
        expiry_month: '06',
        expiry_year: '2027',
        ccv: '456',
        holder_name: 'Jane Doe',
        brand: 'mastercard',
        last4: '4444'
      }
    end

    let(:mock_subscription_response) do
      {
        'id' => 'sub_987654',
        'status' => 'ACTIVE',
        'billingType' => 'CREDIT_CARD',
        'creditCard' => {
          'number' => '**** **** **** 4444'
        }
      }
    end

    before do
      allow_any_instance_of(described_class).to receive(:get).and_return(mock_subscription_response)
      allow_any_instance_of(described_class).to receive(:patch).and_return(mock_subscription_response)
    end

    it 'updates payment method successfully' do
      result = provider.update_payment_method(
        external_subscription_id: 'sub_987654',
        payment_data: new_payment_data
      )

      expect(result).to include(
        external_subscription_id: 'sub_987654',
        payment_method_brand: 'mastercard',
        payment_method_last4: '4444'
      )
    end
  end

  describe '#cancel_subscription' do
    let(:mock_response) do
      {
        'id' => 'sub_987654',
        'status' => 'CANCELLED'
      }
    end

    before do
      allow_any_instance_of(described_class).to receive(:delete).and_return(mock_response)
    end

    it 'cancels subscription successfully' do
      result = provider.cancel_subscription(
        external_subscription_id: 'sub_987654'
      )

      expect(result).to include(
        external_subscription_id: 'sub_987654',
        cancelled_at: be_within(1.second).of(Time.current),
        status: 'cancelled'
      )
    end
  end

  describe '#renew_subscription' do
    let(:mock_subscription_response) do
      {
        'id' => 'sub_987654',
        'status' => 'ACTIVE',
        'billingType' => 'CREDIT_CARD',
        'creditCard' => {
          'number' => '**** **** **** 1111'
        }
      }
    end

    before do
      allow_any_instance_of(described_class).to receive(:get).and_return(mock_subscription_response)
      allow_any_instance_of(described_class).to receive(:post).and_return(mock_subscription_response)
    end

    it 'renews subscription successfully' do
      result = provider.renew_subscription(
        external_subscription_id: 'sub_987654',
        plan: plan,
        payment_data: payment_data
      )

      expect(result).to include(
        external_subscription_id: 'sub_987654',
        status: UserSubscription::STATUSES[:active]
      )
    end

    it 'sets new expiry date' do
      result = provider.renew_subscription(
        external_subscription_id: 'sub_987654',
        plan: plan,
        payment_data: payment_data
      )

      expected_expiry = Time.current + plan.duration_days.days
      expect(result[:expires_at]).to be_within(1.minute).of(expected_expiry)
    end
  end

  describe 'billing type detection' do
    it 'detects credit card correctly' do
      data = { method: 'credit_card' }
      result = provider.send(:determine_billing_type, data)
      expect(result).to eq('CREDIT_CARD')
    end

    it 'detects PIX correctly' do
      data = { method: 'pix' }
      result = provider.send(:determine_billing_type, data)
      expect(result).to eq('PIX')
    end

    it 'detects boleto correctly' do
      data = { method: 'boleto' }
      result = provider.send(:determine_billing_type, data)
      expect(result).to eq('BOLETO')
    end

    it 'defaults to credit card' do
      result = provider.send(:determine_billing_type, {})
      expect(result).to eq('CREDIT_CARD')
    end
  end

  describe 'cycle normalization' do
    it 'converts day to DAILY' do
      result = provider.send(:normalize_cycle, 'day')
      expect(result).to eq('DAILY')
    end

    it 'converts week to WEEKLY' do
      result = provider.send(:normalize_cycle, 'week')
      expect(result).to eq('WEEKLY')
    end

    it 'converts month to MONTHLY' do
      result = provider.send(:normalize_cycle, 'month')
      expect(result).to eq('MONTHLY')
    end

    it 'converts year to YEARLY' do
      result = provider.send(:normalize_cycle, 'year')
      expect(result).to eq('YEARLY')
    end

    it 'defaults to MONTHLY for unknown' do
      result = provider.send(:normalize_cycle, 'unknown')
      expect(result).to eq('MONTHLY')
    end
  end

  describe 'card brand detection' do
    it 'detects Visa' do
      brand = provider.send(:extract_card_brand, '4111111111111111')
      expect(brand).to eq('visa')
    end

    it 'detects Mastercard' do
      brand = provider.send(:extract_card_brand, '5555555555554444')
      expect(brand).to eq('mastercard')
    end

    it 'detects American Express' do
      brand = provider.send(:extract_card_brand, '378282246310005')
      expect(brand).to eq('amex')
    end

    it 'returns unknown for invalid card' do
      brand = provider.send(:extract_card_brand, '1234567890123456')
      expect(brand).to eq('unknown')
    end

    it 'returns unknown for blank card' do
      brand = provider.send(:extract_card_brand, '')
      expect(brand).to eq('unknown')
    end
  end

  describe 'status mapping' do
    it 'maps ACTIVE to active' do
      status = provider.send(:map_status, 'ACTIVE')
      expect(status).to eq(UserSubscription::STATUSES[:active])
    end

    it 'maps PENDING to active' do
      status = provider.send(:map_status, 'PENDING')
      expect(status).to eq(UserSubscription::STATUSES[:active])
    end

    it 'maps INACTIVE to cancelled' do
      status = provider.send(:map_status, 'INACTIVE')
      expect(status).to eq(UserSubscription::STATUSES[:cancelled])
    end

    it 'maps CANCELLED to cancelled' do
      status = provider.send(:map_status, 'CANCELLED')
      expect(status).to eq(UserSubscription::STATUSES[:cancelled])
    end
  end

  describe 'error handling' do
    it 'raises AsaasAPIError on API failure' do
      error_response = { errors: [{ detail: 'Cartão recusado' }] }.to_json
      
      allow_any_instance_of(described_class).to receive(:get).and_raise(
        Faraday::ClientError.new('Error', response: { body: error_response })
      )

      expect {
        provider.create_subscription(
          user: user,
          plan: plan,
          payment_data: payment_data,
          customer_data: customer_data
        )
      }.to raise_error(Payments::AsaasAPIError, /Cartão recusado/)
    end
  end
end
