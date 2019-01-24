class WelcomeController < ApplicationController
  def index
    render json: "MarketViz Backend", status: :accepted
  end
end
