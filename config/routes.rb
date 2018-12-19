Rails.application.routes.draw do
  namespace :api do
   namespace :v1 do
     resources :users, only: [:create]
     resources :search, only: [:create]
     resources :transactions, only: [:create, :destroy]
     post '/login', to: 'auth#create'
     get '/profile', to: 'users#profile'
     get '/usersstocks', to: 'users#stocks'

     ### All passthrough requests to 3rd Party API
     get '/markets', to: 'apis#markets'
     get '/mostactive', to: 'apis#most_active'
     get '/gainers', to: 'apis#gainers'
     get '/losers', to: 'apis#losers'
     get '/marketnews', to: 'apis#market_news'
     get '/sectorperformance', to: 'apis#sector_performance'
     get '/infocus', to: 'apis#in_focus'
     get '/earningstoday', to: 'apis#earnings_today'
     get '/ipostoday', to: 'apis#ipos_today'
     get '/chart/:symbol/:timeframe', to: 'apis#chart'
     get '/quote/:symbol', to: 'apis#quote'
     get '/peers/:symbol', to: 'apis#peers'
     get '/news/:symbol', to: 'apis#news'
     get '/financials/:symbol', to: 'apis#financials'
     get '/companyinfo/:symbol', to: 'apis#company_info'
     get '/logo/:symbol', to: 'apis#logo'
     get '/earnings/:symbol', to: 'apis#earnings'
     get '/keystats/:symbol', to: 'apis#key_stats'
     get '/stockdictionary', to: 'apis#stock_dictionary'
   end
 end
end
