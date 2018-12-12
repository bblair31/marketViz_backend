class Api::V1::ApisController < ApplicationController

  def markets
    @markets = RestClient.get 'https://api.iextrading.com/1.0/market'
    render json: @markets
  end

  def most_active
    @most_active = RestClient.get 'https://api.iextrading.com/1.0/stock/market/list/mostactive'
    render json: @most_active
  end

  def gainers
    @gainers = RestClient.get 'https://api.iextrading.com/1.0/stock/market/list/gainers'
    render json: @gainers
  end

  def losers
    @losers = RestClient.get 'https://api.iextrading.com/1.0/stock/market/list/losers'
    render json: @losers
  end

  def market_news
    @market_news = RestClient.get 'https://api.iextrading.com/1.0/stock/market/news/last/50'
    render json: @market_news
  end

  def sector_performance
    @sector_performance = RestClient.get 'https://api.iextrading.com/1.0/stock/market/sector-performance'
    render json: @sector_performance
  end

  def in_focus
    @in_focus = RestClient.get 'https://api.iextrading.com/1.0/stock/market/list/infocus'
    render json: @in_focus
  end

  def earnings_today
    @earnings_today = RestClient.get 'https://api.iextrading.com/1.0/stock/market/today-earnings'
    render json: @earnings_today
  end

end ### End of API Controller
