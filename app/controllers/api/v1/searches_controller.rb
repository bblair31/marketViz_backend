class Api::V1::SearchesController < ApplicationController
  # skip_before_action :authorized, only: [:create]

  def create
    @search = Search.create(search_params)
    if @search.valid?
     render json: @search, status: :created
    else
     render json: { error: 'failed to create search' }, status: :not_acceptable
    end
  end


private

  def search_params
    params.require(:search).permit(:id, :user_id, :search_term)
  end

end ### End of SearchesController
