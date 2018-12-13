class Api::V1::TransactionsController < ApplicationController
  # skip_before_action :authorized, only: [:create]
  before_action :find_transaction, only [:destroy]

  def create
    @stock = Stock.find_or_create_by(iex_id: params[:iex_id]) do |stock|
      stock.company_name = params[:company_name]
      stock.symbol = params[:symbol]
    end

    params[:stock_id] = @stock.id

    @transaction = Transaction.create(transaction_params)
    if @transaction.valid?
     render json: @transaction, status: :created
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
