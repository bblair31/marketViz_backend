BASE_URL = 'https://api.iextrading.com/1.0'


class Api::V1::ApisController < ApplicationController

  def markets
    @markets = RestClient.get "#{BASE_URL}/market"
    render json: @markets
  end

  def most_active
    @most_active = RestClient.get "#{BASE_URL}/stock/market/list/mostactive"
    render json: @most_active
  end

  def gainers
    @gainers = RestClient.get "#{BASE_URL}/stock/market/list/gainers"
    render json: @gainers
  end

  def losers
    @losers = RestClient.get "#{BASE_URL}/stock/market/list/losers"
    render json: @losers
  end

  def market_news
    @market_news = RestClient.get "#{BASE_URL}/stock/market/news/last/50"
    render json: @market_news
  end

  def sector_performance
    @sector_performance = RestClient.get "#{BASE_URL}/stock/market/sector-performance"
    render json: @sector_performance
  end

  def in_focus
    @in_focus = RestClient.get "#{BASE_URL}/stock/market/list/infocus"
    render json: @in_focus
  end

  def earnings_today
    @earnings_today = RestClient.get "#{BASE_URL}/stock/market/today-earnings"
    render json: @earnings_today
  end

  def ipos_today
    @ipos_today = RestClient.get "#{BASE_URL}/stock/market/today-ipos"
    render json: @ipos_today
  end

  def chart
    @chart = RestClient.get "#{BASE_URL}/stock/#{params[:symbol]}/chart/#{params[:timeframe]}"
    render json: @chart
  end

  def quote
    @quote = RestClient.get "#{BASE_URL}/stock/#{params[:symbol]}/quote"
    render json: @quote
  end

  def peers
    @peers = RestClient.get "#{BASE_URL}/stock/#{params[:symbol]}/peers"
    render json: @peers
  end

  def news
    @news = RestClient.get "#{BASE_URL}/stock/#{params[:symbol]}/news/last/50"
    render json: @news
  end

  def logo
    @company_info = RestClient.get "#{BASE_URL}/stock/#{params[:symbol]}/company"
    render json: @company_info
  end

  def logo
    @logo = RestClient.get "#{BASE_URL}/stock/#{params[:symbol]}/logo"
    render json: @logo
  end

end ### End of API Controller
