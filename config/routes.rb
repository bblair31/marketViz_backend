Rails.application.routes.draw do
  namespace :api do
   namespace :v1 do
     resources :users, only: [:create]
     post '/login', to: 'auth#create'
     get '/profile', to: 'users#profile'

     ### All requests to 3rd Party API
     get '/markets', to: 'apis#markets'
     get '/mostactive', to: 'apis#most_active'
     get '/gainers', to: 'apis#gainers'
     get '/losers', to: 'apis#losers'
     get '/marketnews', to: 'apis#market_news'
     get '/sectorperformance', to: 'apis#sector_performance'
     get '/infocus', to: 'apis#in_focus'
     get '/earningstoday', to: 'apis#earnings_today'
   end
 end
end
