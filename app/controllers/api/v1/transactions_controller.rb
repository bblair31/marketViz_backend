class Api::V1::TransactionsController < ApplicationController
  skip_before_action :authorized, only: [:create, :destroy]
  before_action :find_transaction, only: [:destroy]
  wrap_parameters :transaction, include: [:user_id, :stock_id, :price_bought]

  def create
    @stock = Stock.find_or_create_by(symbol: params[:symbol]) do |stock|
      stock.company_name = params[:company_name]
      stock.iex_id = params[:iex_id]
    end

    @user = User.find_by(username: params[:username])

    params[:stock_id] = @stock.id

    @transaction = Transaction.create(user_id: @user.id, stock_id: params[:stock_id], price_bought: params[:price_bought])

    @stocks = @user.stocks.uniq
    if @transaction.valid?
     render json: @stocks, status: :created
    else
     render json: { error: 'failed to create transaction' }, status: :not_acceptable
    end
  end

  def destroy
    @transaction.destroy
  end


private

  def transaction_params
    params.require(:transaction).permit(:id, :user_id, :stock_id, :price_bought)
  end

  def find_transaction
    @transaction = Transaction.find(params[:id])
  end
end ### End of TransactionController
