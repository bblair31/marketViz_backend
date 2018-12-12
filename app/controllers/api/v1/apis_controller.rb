class Api::V1::ApisController < ApplicationController

  def markets
    @data = RestClient.get 'https://api.iextrading.com/1.0/market'

    render json: @data
  end

end
