Rails.application.routes.draw do
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
  get 'public_setlist/:public_token', to: 'public_setlist#show', as: 'public_setlist'
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
  end
  # devise_for :users
  devise_for :users, controllers: { sessions: 'users/sessions', registrations: 'users/registrations', passwords: 'users/passwords' }

  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Render dynamic PWA files from app/views/pwa/* (remember to link manifest in application.html.erb)
  # get "manifest" => "rails/pwa#manifest", as: :pwa_manifest
  # get "service-worker" => "rails/pwa#service_worker", as: :pwa_service_worker

  # Defines the root path route ("/")
  root "songs#index"
end
