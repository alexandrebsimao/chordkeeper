Rails.application.routes.draw do
  # Sidekiq Web UI - com autenticação básica
  require 'sidekiq/web'
  
  # Sidekiq::Web.use Rack::Auth::Basic do |username, password|
  #   user = User.find_by(email: username)

  #   user.valid_password?(password) && user.role == 'admin' if user
  # end
  
  mount Sidekiq::Web => '/sidekiq'
  
  resources :setlists do
    member do
      get :manage_songs
      get :print
      post :save_songs
      post :add_song
      delete :remove_song
      get :public_link_generator
      delete :public_link_destroyer
    end
  end
  resources :songs do
    member do
      get :generate_pdf
      post :transpose
    end
  end
  resources :libraries do
    member do
      get :define_scope
    end
    resources :users, controller: 'api/library_users', only: [:index, :create, :update, :destroy]
  end
  # devise_for :users
  devise_for :users, controllers: { 
    sessions: 'users/sessions', 
    registrations: 'users/registrations', 
    passwords: 'users/passwords',
    omniauth_callbacks: 'users/omniauth_callbacks'
  }

  # Refresh token endpoint
  post '/users/refresh', to: 'users/sessions#refresh'

  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Render dynamic PWA files from app/views/pwa/* (remember to link manifest in application.html.erb)
  # get "manifest" => "rails/pwa#manifest", as: :pwa_manifest
  # get "service-worker" => "rails/pwa#service_worker", as: :pwa_service_worker

  # Defines the root path route ("/")
  root "songs#index"


  # API routes
  namespace :api do
    # User endpoints
    get 'users/me', to: 'users#me'
    patch 'users/update_password', to: 'users#update_password'

    resources :libraries, only: [:index, :show] do
      resources :users, controller: 'library_users', only: [:index, :create, :update, :destroy]
      member do
        get :define_scope
      end
    end

    resources :songs do
      member do
        get :generate_pdf
        post :transpose
      end
    end

    resources :setlists do
      member do
        get :manage_songs
        get :print
        post :save_songs
        post :add_song
        delete :remove_song
        patch :reorder_songs
        post :public_link_generator
        delete :public_link_destroyer
      end
      resources :users, controller: 'setlist_users', only: [:index, :create, :update, :destroy]
    end
    
    # Public API (sem autenticação)
    namespace :public do
      get 'setlist/:public_token', to: 'setlists#show'
      get 'setlist/:public_token/pdf', to: 'setlists#pdf'
    end
  end
end
