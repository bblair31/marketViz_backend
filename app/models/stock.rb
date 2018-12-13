class Stock < ApplicationRecord
  has_many :transactions
  has_many :users, through: :transactions

  def self.fetch_stocks ### cron job for fetching updated names and symbols
    response = RestClient.get('https://api.iextrading.com/1.0/ref-data/symbols')
    stocks = JSON.parse(response)
  end

end ### End of Stock Class
