class Api::V1::UsersController < ApplicationController
  skip_before_action :authorized, only: [:create, :stocks]
  wrap_parameters :user, include: [:username, :password, :email]

  def profile
    render json: { user: UserSerializer.new(current_user) }, status: :accepted
  end

  def create
    @user = User.create(user_params)

    if @user.valid?
     @token = encode_token(user_id: @user.id)
     render json: { user: UserSerializer.new(@user), jwt: @token }, status: :created
    else
     render json: { error: 'failed to create user' }, status: :not_acceptable
    end
  end

  def watchlist
    @watchlist = current_user.stocks.uniq.map do |stock|
      JSON.parse(RestClient.get "https://api.iextrading.com/1.0/stock/#{stock.symbol}/quote")
    end
    render json: @watchlist, status: :accepted
  end

  def watchlist_news
    news = current_user.stocks.uniq.map do |stock|
      JSON.parse(RestClient.get "https://api.iextrading.com/1.0/stock/#{stock.symbol}/news/last/20")
    end
    @watchlist_news = news.flatten.sort_by{ |news| news["datetime"]}.reverse

    render json: @watchlist_news, status: :accepted
  end

  def watchlist_peers
    peers = current_user.stocks.uniq.map do |stock|
      JSON.parse(RestClient.get "#{BASE_URL}/stock/#{stock.symbol}/peers")
    end
    @watchlist_peers = peers.flatten.map do |peer|
      JSON.parse(RestClient.get "#{BASE_URL}/stock/#{peer}/quote")
    end
    render json: @watchlist_peers
  end

private

  def user_params
    params.require(:user).permit(:id, :username, :password, :email)
  end

end ### End of UsersController
