class Api::V1::StocksController < ApplicationController

  def fetch_stocks
    stocks = Stock.fetch_stocks

    @allStocks = stocks.each do |stock|
      symbol = stock['symbol']
      name = stock['name']
      iex_id = stock['iexId']

      Stock.find_or_create_by(iex_id: iex_id) do |stock|
        stock.symbol = symbol
        stock.company_name = name
      end
    end
    render json: @allStocks
  end

  ### Need to setup fetch to IEX and do find_or_create_by with symbol and name, then return all of the symbols and names to be stored in React?
end ### End of StockController
