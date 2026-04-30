# frozen_string_literal: true

require "rails_helper"

RSpec.describe "User sessions", type: :request do
  let(:password) { "password123" }

  def json_response
    JSON.parse(response.body)
  end

  def create_confirmed_user(email:)
    create(:user, email: email, password: password, password_confirmation: password, confirmed_at: Time.current)
  end

  describe "POST /users/sign_in" do
    it "does not authenticate with a stale auth cookie instead of the submitted credentials" do
      previous_user = create_confirmed_user(email: "previous@example.com")
      post "/users/sign_in",
           params: { user: { email: previous_user.email, password: password } }.to_json,
           headers: { "CONTENT_TYPE" => "application/json" }

      expect(response).to have_http_status(:ok)
      expect(json_response.dig("user", "email")).to eq(previous_user.email)

      post "/users/sign_in",
           params: { user: { email: "missing@example.com", password: "wrong-password" } }.to_json,
           headers: { "CONTENT_TYPE" => "application/json" }

      expect(response).to have_http_status(:unauthorized)
      expect(json_response["error"]).to eq("Email ou senha inválidos")

      get "/api/users/me"

      expect(response).to have_http_status(:unauthorized)
    end

    it "uses the submitted account even when another user auth cookie is present" do
      previous_user = create_confirmed_user(email: "previous@example.com")
      next_user = create_confirmed_user(email: "next@example.com")

      post "/users/sign_in",
           params: { user: { email: previous_user.email, password: password } }.to_json,
           headers: { "CONTENT_TYPE" => "application/json" }

      expect(response).to have_http_status(:ok)

      post "/users/sign_in",
           params: { user: { email: next_user.email, password: password } }.to_json,
           headers: { "CONTENT_TYPE" => "application/json" }

      expect(response).to have_http_status(:ok)
      expect(json_response.dig("user", "email")).to eq(next_user.email)
    end
  end
end
