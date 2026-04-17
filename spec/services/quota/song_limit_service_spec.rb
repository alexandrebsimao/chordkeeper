# Testes para Song Limit Service
# Arquivo: spec/services/quota/song_limit_service_spec.rb

require 'rails_helper'

RSpec.describe Quota::SongLimitService, type: :service do
  let(:user) { create(:user) }
  let(:library) { create(:library, owner: user) }
  
  let(:free_plan) do
    create(:plan, name: "Free", price_cents: 0, duration_days: 999999, interval: "month")
  end
  
  let(:premium_plan) do
    create(:plan, name: "Premium", price_cents: 9999, duration_days: 30, interval: "month")
  end
  
  let(:unlimited_plan) do
    create(:plan, name: "Professional", price_cents: 29999, duration_days: 30, interval: "month")
  end

  before do
    # Adicionar features aos planos
    [free_plan, premium_plan, unlimited_plan].each { |p| p.add_feature("song_limit") }
  end

  describe "initialization" do
    context "when user has no subscription" do
      it "initializes with nil plan" do
        service = described_class.new(user)
        expect(service.limit).to be_nil
      end
    end

    context "when user has active subscription" do
      before do
        create(:user_subscription, user: user, plan: free_plan)
      end

      it "initializes with user's plan" do
        service = described_class.new(user)
        expect(service.limit).to eq 10
      end
    end
  end

  describe "#limit" do
    context "with Free plan" do
      before { create(:user_subscription, user: user, plan: free_plan) }

      it "returns 10" do
        service = described_class.new(user)
        expect(service.limit).to eq 10
      end
    end

    context "with Premium plan" do
      before { create(:user_subscription, user: user, plan: premium_plan) }

      it "returns 100" do
        service = described_class.new(user)
        expect(service.limit).to eq 100
      end
    end

    context "with Professional plan (unlimited)" do
      before { create(:user_subscription, user: user, plan: unlimited_plan) }

      it "returns nil" do
        service = described_class.new(user)
        expect(service.limit).to be_nil
      end
    end
  end

  describe "#limit_label" do
    context "with limited plan" do
      before { create(:user_subscription, user: user, plan: free_plan) }

      it "returns formatted label" do
        service = described_class.new(user)
        expect(service.limit_label).to eq "10 cifra(s)"
      end
    end

    context "with unlimited plan" do
      before { create(:user_subscription, user: user, plan: unlimited_plan) }

      it "returns 'Ilimitado'" do
        service = described_class.new(user)
        expect(service.limit_label).to eq "Ilimitado"
      end
    end
  end

  describe "#songs_count" do
    before { create(:user_subscription, user: user, plan: free_plan) }

    it "counts songs in user's libraries" do
      create_list(:song, 5, library: library)
      service = described_class.new(user)
      expect(service.songs_count).to eq 5
    end

    it "counts across multiple libraries" do
      library2 = create(:library, owner: user)
      create_list(:song, 3, library: library)
      create_list(:song, 2, library: library2)
      
      service = described_class.new(user)
      expect(service.songs_count).to eq 5
    end

    it "does not count songs in other users' libraries" do
      other_user = create(:user)
      other_library = create(:library, owner: other_user)
      
      create_list(:song, 5, library: library)
      create_list(:song, 5, library: other_library)
      
      service = described_class.new(user)
      expect(service.songs_count).to eq 5
    end
  end

  describe "#can_create?" do
    context "with no subscription" do
      it "returns true (graceful degradation)" do
        service = described_class.new(user)
        expect(service.can_create?).to be true
      end
    end

    context "with Free plan (limit: 10)" do
      before { create(:user_subscription, user: user, plan: free_plan) }

      it "returns true when under limit" do
        create_list(:song, 5, library: library)
        service = described_class.new(user)
        expect(service.can_create?).to be true
      end

      it "returns true when at limit - 1" do
        create_list(:song, 9, library: library)
        service = described_class.new(user)
        expect(service.can_create?).to be true
      end

      it "returns false when at limit" do
        create_list(:song, 10, library: library)
        service = described_class.new(user)
        expect(service.can_create?).to be false
      end

      it "returns false when over limit" do
        create_list(:song, 15, library: library)
        service = described_class.new(user)
        expect(service.can_create?).to be false
      end
    end

    context "with Professional plan (unlimited)" do
      before { create(:user_subscription, user: user, plan: unlimited_plan) }

      it "always returns true" do
        create_list(:song, 1000, library: library)
        service = described_class.new(user)
        expect(service.can_create?).to be true
      end
    end
  end

  describe "#available_count" do
    before { create(:user_subscription, user: user, plan: free_plan) }

    it "calculates correctly when under limit" do
      create_list(:song, 3, library: library)
      service = described_class.new(user)
      expect(service.available_count).to eq 7
    end

    it "calculates 0 when at limit" do
      create_list(:song, 10, library: library)
      service = described_class.new(user)
      expect(service.available_count).to eq 0
    end

    it "calculates 0 when over limit" do
      create_list(:song, 15, library: library)
      service = described_class.new(user)
      expect(service.available_count).to eq 0
    end

    context "with unlimited plan" do
      before do
        user.user_subscriptions.delete_all
        create(:user_subscription, user: user, plan: unlimited_plan)
      end

      it "returns infinity" do
        service = described_class.new(user)
        expect(service.available_count).to eq Float::INFINITY
      end
    end
  end

  describe "#usage_percentage" do
    before { create(:user_subscription, user: user, plan: free_plan) }

    it "calculates 0% when no songs" do
      service = described_class.new(user)
      expect(service.usage_percentage).to eq 0.0
    end

    it "calculates 50% with half usage" do
      create_list(:song, 5, library: library)
      service = described_class.new(user)
      expect(service.usage_percentage).to eq 50.0
    end

    it "calculates 100% when at limit" do
      create_list(:song, 10, library: library)
      service = described_class.new(user)
      expect(service.usage_percentage).to eq 100.0
    end

    context "with unlimited plan" do
      before do
        user.user_subscriptions.delete_all
        create(:user_subscription, user: user, plan: unlimited_plan)
      end

      it "returns 0.0" do
        create_list(:song, 1000, library: library)
        service = described_class.new(user)
        expect(service.usage_percentage).to eq 0.0
      end
    end
  end

  describe "#near_limit?" do
    before { create(:user_subscription, user: user, plan: free_plan) }

    it "returns true when >= 80%" do
      create_list(:song, 8, library: library)  # 80%
      service = described_class.new(user)
      expect(service.near_limit?).to be true
    end

    it "returns true when > 80%" do
      create_list(:song, 9, library: library)  # 90%
      service = described_class.new(user)
      expect(service.near_limit?).to be true
    end

    it "returns false when < 80%" do
      create_list(:song, 7, library: library)  # 70%
      service = described_class.new(user)
      expect(service.near_limit?).to be false
    end
  end

  describe "#at_limit?" do
    before { create(:user_subscription, user: user, plan: free_plan) }

    it "returns true when at limit" do
      create_list(:song, 10, library: library)
      service = described_class.new(user)
      expect(service.at_limit?).to be true
    end

    it "returns false when under limit" do
      create_list(:song, 9, library: library)
      service = described_class.new(user)
      expect(service.at_limit?).to be false
    end
  end

  describe "#status" do
    before { create(:user_subscription, user: user, plan: free_plan) }

    it "returns complete status hash" do
      create_list(:song, 3, library: library)
      service = described_class.new(user)
      
      status = service.status
      
      expect(status).to include(
        plan: "Free",
        limit: 10,
        limit_label: "10 cifra(s)",
        used: 3,
        available: 7,
        percentage: 30.0,
        can_create: true,
        near_limit: false,
        at_limit: false
      )
    end

    context "when at limit" do
      it "returns correct values" do
        create_list(:song, 10, library: library)
        service = described_class.new(user)
        
        status = service.status
        
        expect(status[:can_create]).to be false
        expect(status[:at_limit]).to be true
        expect(status[:available]).to eq 0
      end
    end
  end

  describe "#validate!" do
    before { create(:user_subscription, user: user, plan: free_plan) }

    context "when can create" do
      it "does not raise" do
        create_list(:song, 5, library: library)
        service = described_class.new(user)
        expect { service.validate! }.not_to raise_error
      end
    end

    context "when cannot create" do
      it "raises QuotaExceeded" do
        create_list(:song, 10, library: library)
        service = described_class.new(user)
        expect { service.validate! }.to raise_error(Quota::SongLimitService::QuotaExceeded)
      end
    end
  end

  describe "#error_message" do
    context "with no subscription" do
      it "returns no subscription message" do
        service = described_class.new(user)
        expect(service.error_message).to include("assinatura ativa")
      end
    end

    context "when at limit" do
      before { create(:user_subscription, user: user, plan: free_plan) }

      it "returns descriptive message" do
        create_list(:song, 10, library: library)
        service = described_class.new(user)
        expect(service.error_message).to include("atingiu o limite")
        expect(service.error_message).to include("Free")
      end
    end
  end

  describe "#warning_message" do
    before { create(:user_subscription, user: user, plan: free_plan) }

    context "when near limit" do
      it "returns warning" do
        create_list(:song, 8, library: library)
        service = described_class.new(user)
        expect(service.warning_message).to include("80%")
        expect(service.warning_message).to include("2")  # available
      end
    end

    context "when not near limit" do
      it "returns nil" do
        create_list(:song, 5, library: library)
        service = described_class.new(user)
        expect(service.warning_message).to be_nil
      end
    end

    context "with unlimited plan" do
      before do
        user.user_subscriptions.delete_all
        create(:user_subscription, user: user, plan: unlimited_plan)
      end

      it "returns nil" do
        service = described_class.new(user)
        expect(service.warning_message).to be_nil
      end
    end
  end
end
