Rails.application.routes.draw do
  namespace :api do
   namespace :v1 do
     get '/markets', to: 'apis#markets'
   end
 end
end
